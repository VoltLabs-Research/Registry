import type { Request, Response } from 'express';
import { HttpStatus } from '@/core/http/HttpStatus.js';
import type { SearchUseCase } from '@/modules/search/application/SearchUseCase.js';
import type { SearchPresenter } from '@/modules/search/infrastructure/http/SearchPresenter.js';

export class SearchController {
    constructor(
        private readonly searchUseCase: SearchUseCase,
        private readonly presenter: SearchPresenter
    ) {}

    search = async (request: Request, response: Response): Promise<void> => {
        const outcome = await this.searchUseCase.execute(request.query);
        response.status(HttpStatus.Ok).json(this.presenter.toResponse(outcome));
    };
}
