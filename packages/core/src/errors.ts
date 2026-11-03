export class OrchestratorError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class IdempotencyConflictError extends OrchestratorError {
  readonly key: string;

  constructor(key: string) {
    super(
      'idempotency_conflict',
      `Idempotency key ${key} was reused with a different request body`,
    );
    this.key = key;
  }
}
