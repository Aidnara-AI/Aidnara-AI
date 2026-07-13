import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('AidnaraAidRegistry', () => {
  async function deployRegistry() {
    const [owner, donor, stranger] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory('AidnaraAidRegistry');
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    return { registry, owner, donor, stranger };
  }

  it('creates a campaign', async () => {
    const { registry, owner } = await deployRegistry();

    await expect(registry.createCampaign('ipfs://campaign', 100n))
      .to.emit(registry, 'CampaignCreated')
      .withArgs(1n, owner.address, 'ipfs://campaign', 100n);

    const campaign = await registry.campaigns(1);
    expect(campaign.owner).to.equal(owner.address);
    expect(campaign.metadataURI).to.equal('ipfs://campaign');
    expect(campaign.targetAmount).to.equal(100n);
  });

  it('accepts donation and tracks total', async () => {
    const { registry, donor } = await deployRegistry();

    await registry.createCampaign('ipfs://campaign', 100n);

    await expect(registry.connect(donor).donate(1, { value: 25n }))
      .to.emit(registry, 'DonationReceived')
      .withArgs(1n, donor.address, 25n);

    const campaign = await registry.campaigns(1);
    expect(campaign.totalDonated).to.equal(25n);
  });

  it('blocks non-owner proof submission', async () => {
    const { registry, stranger } = await deployRegistry();

    await registry.createCampaign('ipfs://campaign', 100n);

    await expect(
      registry.connect(stranger).submitProof(1, 'ipfs://proof', ethers.id('proof')),
    ).to.be.revertedWith('Not campaign owner');
  });

  it('stores proof submitted by owner', async () => {
    const { registry } = await deployRegistry();
    const proofHash = ethers.id('proof');

    await registry.createCampaign('ipfs://campaign', 100n);
    await expect(registry.submitProof(1, 'ipfs://proof', proofHash))
      .to.emit(registry, 'ProofSubmitted')
      .withArgs(1n, proofHash, 'ipfs://proof');

    expect(await registry.getProofCount(1)).to.equal(1n);
    const proof = await registry.getProof(1, 0);
    expect(proof.proofURI).to.equal('ipfs://proof');
    expect(proof.proofHash).to.equal(proofHash);
  });

  it('issues and verifies certificate', async () => {
    const { registry, donor } = await deployRegistry();
    const certificateHash = ethers.id('certificate');

    await registry.createCampaign('ipfs://campaign', 100n);
    await expect(registry.issueCertificate(1, donor.address, 'donor', 'ipfs://certificate', certificateHash))
      .to.emit(registry, 'CertificateIssued')
      .withArgs(1n, donor.address, certificateHash, 'donor');

    const certificate = await registry.verifyCertificate(certificateHash);
    expect(certificate.recipient).to.equal(donor.address);
    expect(certificate.certificateURI).to.equal('ipfs://certificate');
    expect(certificate.valid).to.equal(true);
  });

  it('prevents duplicate certificate hash', async () => {
    const { registry, donor } = await deployRegistry();
    const certificateHash = ethers.id('certificate');

    await registry.createCampaign('ipfs://campaign', 100n);
    await registry.issueCertificate(1, donor.address, 'donor', 'ipfs://certificate', certificateHash);

    await expect(
      registry.issueCertificate(1, donor.address, 'donor', 'ipfs://certificate-2', certificateHash),
    ).to.be.revertedWith('Certificate already exists');
  });

  it('withdraws only campaign balance', async () => {
    const { registry, owner, donor } = await deployRegistry();

    await registry.createCampaign('ipfs://campaign-1', 100n);
    await registry.connect(donor).donate(1, { value: 25n });

    await expect(registry.withdraw(1, 10n))
      .to.emit(registry, 'FundsWithdrawn')
      .withArgs(1n, owner.address, 10n);

    const campaign = await registry.campaigns(1);
    expect(campaign.totalWithdrawn).to.equal(10n);

    await expect(registry.withdraw(1, 16n)).to.be.revertedWith('Insufficient campaign balance');
  });
});
