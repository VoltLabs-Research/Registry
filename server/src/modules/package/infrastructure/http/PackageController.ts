import type { Request, Response } from 'express';
import { HttpStatus } from '@/core/http/HttpStatus.js';
import { UnauthorizedError, ValidationError } from '@/core/errors/AppError.js';
import type { Identity } from '@/core/http/middleware/requireAuth.js';
import type { GetPackumentUseCase } from '@/modules/package/application/GetPackumentUseCase.js';
import type { GetVersionUseCase } from '@/modules/package/application/GetVersionUseCase.js';
import type { PublishBundle, PublishPackageUseCase } from '@/modules/package/application/PublishPackageUseCase.js';
import type { DeprecateVersionUseCase } from '@/modules/package/application/DeprecateVersionUseCase.js';
import type { PackagePresenter } from '@/modules/package/infrastructure/http/PackagePresenter.js';

interface UploadedFile {
    fieldname: string;
    buffer: Buffer;
}

export class PackageController {
    constructor(
        private readonly getPackumentUseCase: GetPackumentUseCase,
        private readonly getVersionUseCase: GetVersionUseCase,
        private readonly publishPackageUseCase: PublishPackageUseCase,
        private readonly deprecateVersionUseCase: DeprecateVersionUseCase,
        private readonly presenter: PackagePresenter
    ) {}

    getPackument = async (request: Request, response: Response): Promise<void> => {
        const { username = '', name = '' } = request.params;
        const packument = await this.getPackumentUseCase.execute({ username, name });
        response.status(HttpStatus.Ok).json(this.presenter.toPackument(packument));
    };

    getVersion = async (request: Request, response: Response): Promise<void> => {
        const { username = '', name = '', version = '' } = request.params;
        const packageVersion = await this.getVersionUseCase.execute({ username, name, version });
        response.status(HttpStatus.Ok).json(this.presenter.toVersion(packageVersion));
    };

    publish = async (request: Request, response: Response): Promise<void> => {
        const identity = this.requireIdentity(request);
        const { username = '', name = '' } = request.params;

        const packument = await this.publishPackageUseCase.execute({
            username,
            name,
            accountId: identity.accountId,
            actorUsername: identity.username,
            manifest: this.parseManifestField(request),
            readme: this.readReadmeField(request),
            bundles: this.readBundles(request)
        });

        response.status(HttpStatus.Created).json(this.presenter.toPackument(packument));
    };

    deprecate = async (request: Request, response: Response): Promise<void> => {
        const identity = this.requireIdentity(request);
        const { username = '', name = '', version = '' } = request.params;
        const reason = this.readReason(request) ?? '';

        const deprecatedVersion = await this.deprecateVersionUseCase.execute({
            username,
            name,
            version,
            accountId: identity.accountId,
            actorUsername: identity.username,
            reason
        });
        response.status(HttpStatus.Ok).json({
            deprecated: true,
            version: deprecatedVersion.version,
            reason: deprecatedVersion.deprecated?.reason
        });
    };

    private requireIdentity(request: Request): Identity {
        if (!request.identity) {
            throw new UnauthorizedError('Authentication required');
        }
        return request.identity;
    }

    private parseManifestField(request: Request): unknown {
        const manifestField = (request.body as Record<string, unknown> | undefined)?.manifest;
        if (typeof manifestField !== 'string') {
            throw new ValidationError('A "manifest" form field (JSON string) is required');
        }
        try {
            return JSON.parse(manifestField);
        } catch {
            throw new ValidationError('The "manifest" field is not valid JSON');
        }
    }

    private readReadmeField(request: Request): string | undefined {
        const readme = (request.body as Record<string, unknown> | undefined)?.readme;
        return typeof readme === 'string' ? readme : undefined;
    }

    private readBundles(request: Request): PublishBundle[] {
        const files = (request.files as UploadedFile[] | undefined) ?? [];
        return files.map((file) => ({ tag: file.fieldname, body: file.buffer }));
    }

    private readReason(request: Request): string | undefined {
        const reason = (request.body as Record<string, unknown> | undefined)?.reason;
        return typeof reason === 'string' ? reason : undefined;
    }
}
