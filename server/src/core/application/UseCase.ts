export interface UseCase<Input, Output> {
    execute(input: Input): Promise<Output>;
}

export interface UseCaseWithoutInput<Output> {
    execute(): Promise<Output>;
}
