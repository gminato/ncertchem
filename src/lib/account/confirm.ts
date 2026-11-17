/** Confirms an Account deletion: the Learner must type DELETE exactly. */
export function isDeleteConfirmed(input: string): boolean {
  return input === 'DELETE'
}
