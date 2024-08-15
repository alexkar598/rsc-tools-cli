type ReturnTypeArgs<
  Args extends any[],
  T extends (...args: Args) => any,
> = T extends (...args: Args) => infer R ? R : any;

export function safeExec<
  Callback extends (...args: any[]) => any,
  Args extends Parameters<Callback>,
>(
  cb: Callback,
  error: (error: any) => void,
  ...args: Args
): ReturnTypeArgs<Args, Callback> | typeof EXEC_FAIL {
  try {
    return cb(...args);
  } catch (e) {
    error(e);
    return EXEC_FAIL;
  }
}

export const EXEC_FAIL = Symbol("safeExec failed");
