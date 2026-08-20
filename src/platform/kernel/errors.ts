/**
 * Typed engine errors. Every one of these is a case the specification requires
 * be reported rather than silently worked around.
 */

export class EngineError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

/** A model declares a compartment structure the solver does not implement. */
export class UnsupportedModelStructure extends EngineError {
  constructor(readonly modelId: string, readonly compartments: number) {
    super(
      'UnsupportedModelStructure',
      `Model ${modelId} declares ${compartments} compartments; the solver supports 1, 2 and 3. `
      + 'It is refused rather than truncated.',
    );
  }
}

/** A model publishes no effect-site rate constant, so it has no effect-site curve. */
export class NoEffectSiteForModel extends EngineError {
  constructor(readonly modelId: string) {
    super(
      'NoEffectSiteForModel',
      `Model ${modelId} publishes no effect-site rate constant. The plasma curve is shown alone; `
      + 'no constant is borrowed from another model.',
    );
  }
}

/** A covariate the model requires is absent from the patient declaration. */
export class MissingCovariate extends EngineError {
  constructor(readonly modelId: string, readonly covariate: string) {
    super(
      'MissingCovariate',
      `Model ${modelId} requires covariate "${covariate}", which the patient declaration omits. `
      + 'No simulation step runs.',
    );
  }
}

/** A parameter a publication does not give is absent, never invented. */
export class ParameterNotPublished extends EngineError {
  constructor(readonly modelId: string, readonly parameter: string) {
    super(
      'ParameterNotPublished',
      `Model ${modelId} does not publish "${parameter}". It is treated as absent rather than `
      + 'borrowed, imputed, or averaged across models.',
    );
  }
}
