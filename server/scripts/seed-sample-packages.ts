import { createHash } from 'node:crypto';
import semver from 'semver';
import logger from '@/core/config/logger.js';
import { connectDatabase, disconnectDatabase } from '@/core/config/db.js';
import { PackageModel } from '@/modules/package/infrastructure/persistence/PackageModel.js';
import { VersionModel } from '@/modules/package/infrastructure/persistence/VersionModel.js';
import type { PackageKind } from '@/modules/package/domain/Package.js';

const USERNAME = 'voltlabs';
const SYSTEM_ACCOUNT_ID = process.env.SYSTEM_ACCOUNT_ID ?? '000000000000000000000001';

const ENGINE_PLATFORMS = ['linux-x86_64', 'darwin-arm64', 'windows-x86_64'];

interface SeedRelease {
    version: string;
    deprecatedReason?: string;
}

interface SeedPackage {
    name: string;
    pascalName: string;
    kind: PackageKind;
    description: string;
    downloads: number;
    firstSeen: string;
    version: string;
    keywords: string[];
    readme: string;
    releases?: SeedRelease[];
}

const releasesOf = (pkg: SeedPackage): SeedRelease[] =>
    pkg.releases ?? [{ version: pkg.version }];

const latestVersionOf = (pkg: SeedPackage): string =>
    releasesOf(pkg)
        .map((release) => release.version)
        .sort(semver.rcompare)[0] ?? pkg.version;

const buildActivity = (total: number): number[] => {
    const base = total / 52;
    const noise = [0.92, 1.07, 0.88, 1.12, 0.97, 1.04, 0.91, 1.09];
    return noise.map((factor) => Math.round(base * factor));
};

const last30d = (total: number): number => Math.round(total * 0.06);

const PACKAGES: SeedPackage[] = [
    {
        name: 'opendxa',
        pascalName: 'Opendxa',
        kind: 'engine',
        description: 'Dislocation eXtraction Algorithm (DXA) for crystal defect analysis.',
        downloads: 1900000,
        firstSeen: '2026-01-08',
        version: '1.2.0',
        releases: [
            { version: '1.0.0', deprecatedReason: 'superseded by 1.2.0' },
            { version: '1.1.0', deprecatedReason: 'superseded by 1.2.0' },
            { version: '1.2.0' }
        ],
        keywords: ['dxa', 'dislocation', 'crystal', 'defect', 'burgers'],
        readme: `# opendxa

opendxa implements the Dislocation eXtraction Algorithm (DXA), a robust method for
identifying and characterizing dislocation lines in atomistic simulations of
crystalline materials. It traces interface meshes around defective regions, assigns
Burgers vectors, and produces a clean dislocation network suitable for downstream
plasticity analysis.

## Installation

\`\`\`bash
vpm install @voltlabs/opendxa
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.opendxa import DislocationExtraction

pipeline = Pipeline.from_dump('relaxed.dump')
result = pipeline.run(DislocationExtraction(crystal_structure='fcc', line_smoothing=True))

for line in result.dislocations:
    print(line.burgers_vector, line.length, line.character)
\`\`\`

## Output

- Dislocation line segments with assigned Burgers vectors
- Per-line character (edge, screw, mixed) and total line length
- Defect interface mesh for visualization
- Dislocation density per unit volume
`
    },
    {
        name: 'polyhedral-template-matching',
        pascalName: 'PolyhedralTemplateMatching',
        kind: 'engine',
        description: 'Robust local structure identification via polyhedral templates.',
        downloads: 509400,
        firstSeen: '2026-01-12',
        version: '1.0.0',
        keywords: ['ptm', 'structure', 'classification', 'polyhedral', 'crystal'],
        readme: `# polyhedral-template-matching

polyhedral-template-matching (PTM) classifies the local crystalline structure around
each atom by matching its neighbor polyhedron against a library of ideal templates. It
is far less sensitive to thermal noise and elastic strain than coordination-based
methods, making it reliable at finite temperature.

## Installation

\`\`\`bash
vpm install @voltlabs/polyhedral-template-matching
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.ptm import PolyhedralTemplateMatching

pipeline = Pipeline.from_dump('quenched.dump')
result = pipeline.run(PolyhedralTemplateMatching(rmsd_cutoff=0.12))

print(result.structure_counts)
\`\`\`

## Output

- Per-atom structure type (FCC, HCP, BCC, ICO, SC, other)
- RMSD of the best-matching template
- Local lattice orientation (quaternion) per atom
- Interatomic distance scaling factor
`
    },
    {
        name: 'adaptive-common-neighbor-analysis',
        pascalName: 'AdaptiveCommonNeighborAnalysis',
        kind: 'engine',
        description: 'Adaptive common-neighbor analysis (a-CNA) structure classification.',
        downloads: 455400,
        firstSeen: '2026-01-15',
        version: '1.0.0',
        keywords: ['cna', 'acna', 'structure', 'classification', 'neighbor'],
        readme: `# adaptive-common-neighbor-analysis

adaptive-common-neighbor-analysis (a-CNA) determines the local crystal structure of
each atom from the topology of its common neighbors. The adaptive variant computes a
per-atom cutoff radius, so a single analysis correctly handles multiple lattice
constants and mixed-phase systems without manual tuning.

## Installation

\`\`\`bash
vpm install @voltlabs/adaptive-common-neighbor-analysis
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.acna import AdaptiveCommonNeighborAnalysis

pipeline = Pipeline.from_dump('interface.dump')
result = pipeline.run(AdaptiveCommonNeighborAnalysis())

print(result.structure_counts)
\`\`\`

## Output

- Per-atom structure type (FCC, HCP, BCC, ICO, other)
- Aggregate structure-type histogram
- Adaptive cutoff radius used per atom
- Selection mask for non-crystalline atoms
`
    },
    {
        name: 'centrosymmetry-parameter',
        pascalName: 'CentrosymmetryParameter',
        kind: 'engine',
        description: 'Centrosymmetry parameter for crystal defect detection.',
        downloads: 423400,
        firstSeen: '2026-01-18',
        version: '1.0.0',
        keywords: ['centrosymmetry', 'csp', 'defect', 'crystal', 'surface'],
        readme: `# centrosymmetry-parameter

centrosymmetry-parameter computes the centrosymmetry parameter (CSP) for each atom, a
scalar that measures the local breaking of inversion symmetry. Bulk atoms in a
centrosymmetric lattice yield values near zero, while atoms near dislocations, stacking
faults, and free surfaces produce large values.

## Installation

\`\`\`bash
vpm install @voltlabs/centrosymmetry-parameter
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.csp import CentrosymmetryParameter

pipeline = Pipeline.from_dump('deformed.dump')
result = pipeline.run(CentrosymmetryParameter(num_neighbors=12))

defects = result.atoms[result.atoms.csp > 1.0]
print(len(defects), 'defective atoms')
\`\`\`

## Output

- Per-atom centrosymmetry parameter
- Suggested threshold for defect selection
- Histogram of CSP values across the configuration
`
    },
    {
        name: 'coordination-analysis',
        pascalName: 'CoordinationAnalysis',
        kind: 'engine',
        description: 'Coordination number and radial distribution analysis.',
        downloads: 374000,
        firstSeen: '2026-01-21',
        version: '1.0.0',
        keywords: ['coordination', 'rdf', 'neighbor', 'radial', 'distribution'],
        readme: `# coordination-analysis

coordination-analysis counts the number of neighbors within a cutoff radius for every
atom and computes the system-wide radial distribution function (RDF). It is a workhorse
for characterizing local density, identifying under- and over-coordinated sites, and
inspecting short-range order.

## Installation

\`\`\`bash
vpm install @voltlabs/coordination-analysis
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.coordination import CoordinationAnalysis

pipeline = Pipeline.from_dump('melt.dump')
result = pipeline.run(CoordinationAnalysis(cutoff=3.2, compute_rdf=True))

print(result.mean_coordination)
result.rdf.to_csv('rdf.csv')
\`\`\`

## Output

- Per-atom coordination number
- Mean and standard deviation of coordination
- Tabulated radial distribution function g(r)
- Optional partial RDFs per element pair
`
    },
    {
        name: 'atomic-strain',
        pascalName: 'AtomicStrain',
        kind: 'engine',
        description: 'Per-atom strain tensor relative to a reference configuration.',
        downloads: 360300,
        firstSeen: '2026-01-24',
        version: '1.0.0',
        keywords: ['strain', 'deformation', 'tensor', 'reference', 'shear'],
        readme: `# atomic-strain

atomic-strain computes a per-atom deformation gradient and the associated
Green-Lagrange strain tensor by comparing each atom's local neighborhood against a
reference configuration. Derived scalars such as the von Mises shear strain make it
easy to localize plastic events.

## Installation

\`\`\`bash
vpm install @voltlabs/atomic-strain
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.atomic_strain import AtomicStrain

pipeline = Pipeline.from_dump('current.dump')
result = pipeline.run(AtomicStrain(reference='reference.dump', cutoff=3.0))

print(result.atoms.shear_strain.max())
\`\`\`

## Output

- Per-atom deformation gradient tensor F
- Green-Lagrange strain tensor components
- Von Mises shear strain invariant
- Rotation-invariant volumetric strain
`
    },
    {
        name: 'elastic-strain',
        pascalName: 'ElasticStrain',
        kind: 'engine',
        description: 'Elastic strain and lattice rotation (Green-Lagrange).',
        downloads: 352500,
        firstSeen: '2026-01-27',
        version: '1.0.0',
        keywords: ['elastic', 'strain', 'lattice', 'rotation', 'green-lagrange'],
        readme: `# elastic-strain

elastic-strain recovers the per-atom elastic deformation by mapping each atom's
neighborhood onto an ideal reference lattice. Unlike total-strain measures it separates
the elastic part from plastic rearrangements, yielding the elastic strain tensor and
the local lattice rotation.

## Installation

\`\`\`bash
vpm install @voltlabs/elastic-strain
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.elastic_strain import ElasticStrain

pipeline = Pipeline.from_dump('loaded.dump')
result = pipeline.run(ElasticStrain(crystal_structure='bcc', lattice_constant=2.86))

print(result.atoms.elastic_volumetric_strain.mean())
\`\`\`

## Output

- Per-atom elastic strain tensor (Green-Lagrange)
- Local lattice rotation matrix
- Elastic volumetric strain
- Selection of atoms exceeding an elastic strain threshold
`
    },
    {
        name: 'cluster-analysis',
        pascalName: 'ClusterAnalysis',
        kind: 'engine',
        description: 'Connected-component clustering of atoms.',
        downloads: 343700,
        firstSeen: '2026-01-30',
        version: '1.0.0',
        keywords: ['cluster', 'connected-components', 'grouping', 'percolation'],
        readme: `# cluster-analysis

cluster-analysis groups atoms into connected components using a distance-based
neighbor graph. It is ideal for counting precipitates, tracking voids, measuring
percolating networks, and isolating physically distinct fragments after fracture.

## Installation

\`\`\`bash
vpm install @voltlabs/cluster-analysis
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.cluster import ClusterAnalysis

pipeline = Pipeline.from_dump('precipitates.dump')
result = pipeline.run(ClusterAnalysis(cutoff=3.4, only_selected=True))

print('clusters found:', result.cluster_count)
print('largest cluster size:', result.clusters[0].size)
\`\`\`

## Output

- Per-atom cluster identifier
- Cluster sizes sorted in descending order
- Center of mass and radius of gyration per cluster
- Total number of clusters
`
    },
    {
        name: 'displacements-analysis',
        pascalName: 'DisplacementsAnalysis',
        kind: 'engine',
        description: 'Per-atom displacement vectors across timesteps.',
        downloads: 314500,
        firstSeen: '2026-02-02',
        version: '1.0.0',
        keywords: ['displacement', 'timestep', 'trajectory', 'diffusion'],
        readme: `# displacements-analysis

displacements-analysis computes per-atom displacement vectors between a reference
frame and the current configuration, with optional minimum-image handling for periodic
boundaries. It underpins diffusion studies, mean-squared-displacement curves, and
visualization of collective motion.

## Installation

\`\`\`bash
vpm install @voltlabs/displacements-analysis
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.displacements import DisplacementsAnalysis

pipeline = Pipeline.from_dump('trajectory.dump')
result = pipeline.run(DisplacementsAnalysis(reference_frame=0, use_minimum_image=True))

print('MSD:', result.mean_squared_displacement)
\`\`\`

## Output

- Per-atom displacement vector components
- Displacement magnitude per atom
- Mean-squared displacement of the configuration
- Optional decomposition by atom type
`
    },
    {
        name: 'pattern-structure-matching',
        pascalName: 'PatternStructureMatching',
        kind: 'engine',
        description: 'Match atomic neighborhoods against reference structures.',
        downloads: 304600,
        firstSeen: '2026-02-05',
        version: '1.0.0',
        keywords: ['pattern', 'matching', 'reference', 'structure', 'template'],
        readme: `# pattern-structure-matching

pattern-structure-matching identifies user-defined local atomic motifs by comparing
each atom's neighborhood against a set of reference patterns. It is useful for locating
specific defect cores, dopant environments, or engineered nanostructures that standard
classifiers do not recognize.

## Installation

\`\`\`bash
vpm install @voltlabs/pattern-structure-matching
\`\`\`

## Usage

\`\`\`python
from volt import Pipeline
from voltlabs.pattern import PatternStructureMatching

pipeline = Pipeline.from_dump('doped.dump')
result = pipeline.run(PatternStructureMatching(reference='motif.xyz', tolerance=0.18))

print('matches:', result.match_count)
\`\`\`

## Output

- Per-atom match flag and matched pattern index
- Match score (lower is closer) per atom
- Total number of matched neighborhoods
- Selection of atoms belonging to each pattern
`
    },
];

const dummySha256 = (input: string): string =>
    createHash('sha256').update(input).digest('hex');

const upsertPackage = async (pkg: SeedPackage): Promise<string> => {
    const fullName = `@${USERNAME}/${pkg.name}`;
    const total = pkg.downloads;
    const publishedAt = new Date(`${pkg.firstSeen}T00:00:00.000Z`);

    const update = {
        username: USERNAME,
        name: pkg.name,
        fullName,
        kind: pkg.kind,
        description: pkg.description,
        keywords: pkg.keywords,
        homepage: `https://github.com/VoltLabs-Research/${pkg.pascalName}`,
        repository: {
            type: 'git',
            url: `https://github.com/VoltLabs-Research/${pkg.pascalName}`
        },
        distTags: { latest: latestVersionOf(pkg) },
        downloads: { total, last30d: last30d(total) },
        readme: pkg.readme,
        activity: buildActivity(total),
        firstSeen: publishedAt,
        verified: true
    };

    const doc = await PackageModel.findOneAndUpdate(
        { fullName },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!doc) {
        throw new Error(`Failed to upsert package ${fullName}`);
    }
    return doc._id.toString();
};

const upsertRelease = async (
    packageId: string,
    pkg: SeedPackage,
    release: SeedRelease,
    index: number
): Promise<void> => {
    const fullName = `@${USERNAME}/${pkg.name}`;
    const platforms =
        pkg.kind === 'engine'
            ? ENGINE_PLATFORMS.map((tag) => {
                  const sha256 = dummySha256(`${fullName}@${release.version}/${tag}`);
                  return {
                      tag,
                      sha256,
                      key: `${packageId}/${release.version}/${tag}.tgz`,
                      sizeBytes: 4_194_304
                  };
              })
            : [];

    const aggregateSha = dummySha256(`${fullName}@${release.version}`);
    const sizeBytes = platforms.reduce((sum, p) => sum + p.sizeBytes, 0);

    const manifest = {
        name: fullName,
        version: release.version,
        kind: pkg.kind,
        description: pkg.description,
        publisher: USERNAME,
        license: 'Apache-2.0',
        homepage: `https://github.com/VoltLabs-Research/${pkg.pascalName}`,
        repository: {
            type: 'git',
            url: `https://github.com/VoltLabs-Research/${pkg.pascalName}`
        },
        keywords: pkg.keywords,
        platforms: platforms.map((p) => p.tag)
    };

    const publishedAt = new Date(`${pkg.firstSeen}T00:00:00.000Z`);
    publishedAt.setUTCDate(publishedAt.getUTCDate() + index);

    const deprecated = release.deprecatedReason
        ? { reason: release.deprecatedReason, at: publishedAt }
        : undefined;

    await VersionModel.findOneAndUpdate(
        { packageId, version: release.version },
        {
            $set: {
                packageId,
                version: release.version,
                manifest,
                sha256: aggregateSha,
                sizeBytes,
                publishedAt,
                publishedBy: SYSTEM_ACCOUNT_ID,
                platforms,
                ...(deprecated ? { deprecated } : {})
            },
            ...(deprecated ? {} : { $unset: { deprecated: '' } })
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const upsertVersions = async (packageId: string, pkg: SeedPackage): Promise<void> => {
    const releases = releasesOf(pkg);
    for (const [index, release] of releases.entries()) {
        await upsertRelease(packageId, pkg, release, index);
    }
    const canonicalVersions = releases.map((release) => release.version);
    await VersionModel.deleteMany({ packageId, version: { $nin: canonicalVersions } });
};

const pruneStalePackages = async (canonicalFullNames: string[]): Promise<void> => {
    const stale = await PackageModel.find({ fullName: { $nin: canonicalFullNames } });
    if (stale.length === 0) {
        return;
    }
    const staleIds = stale.map((doc) => doc._id);
    await VersionModel.deleteMany({ packageId: { $in: staleIds.map((id) => id.toString()) } });
    await PackageModel.deleteMany({ _id: { $in: staleIds } });
    logger.info(
        { removed: stale.map((doc) => doc.fullName) },
        'pruned non-plugin packages'
    );
};

const main = async (): Promise<void> => {
    await connectDatabase();
    try {
        const canonicalFullNames = PACKAGES.map((pkg) => `@${USERNAME}/${pkg.name}`);
        await pruneStalePackages(canonicalFullNames);
        let count = 0;
        for (const pkg of PACKAGES) {
            const packageId = await upsertPackage(pkg);
            await upsertVersions(packageId, pkg);
            count += 1;
            logger.info({ fullName: `@${USERNAME}/${pkg.name}`, kind: pkg.kind }, 'package seeded');
        }
        await PackageModel.collection.updateMany({}, { $unset: { securityAudits: '', githubStars: '' } });
        logger.info({ count }, 'sample package seed complete');
    } finally {
        await disconnectDatabase();
    }
};

main().catch((err) => {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'sample seed failed');
    process.exit(1);
});
