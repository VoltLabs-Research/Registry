import { z } from 'zod';
import semver from 'semver';

const repositorySchema = z.object({
    type: z.string().min(1),
    url: z.string().min(1)
});

export const publishManifestSchema = z
    .object({
        name: z.string().regex(/^@[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/, 'name must be @username/name'),
        version: z.string().refine((value) => semver.valid(value) !== null, 'version must be valid semver'),
        kind: z.enum(['engine', 'workflow', 'lib']),
        publisher: z.string().min(1),
        description: z.string().optional(),
        license: z.string().optional(),
        homepage: z.string().optional(),
        repository: repositorySchema.optional(),
        keywords: z.array(z.string()).optional(),
        entrypoints: z
            .object({ binary: z.string().optional(), workflow: z.string().optional() })
            .optional(),
        nodeTypes: z.array(z.string()).optional(),
        platforms: z.array(z.string()).optional(),
        voltsdk: z.string().optional(),
        coretoolkit: z.string().optional(),
        files: z.array(z.string()).optional()
    })
    .passthrough();

export type PublishManifest = z.infer<typeof publishManifestSchema>;
