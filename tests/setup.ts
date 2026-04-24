/**
 * Abstract testing framework wrapper.
 *
 * Re-exports the standard testing primitives from vitest so that
 * all test files import from this single entry-point.  Swapping
 * the underlying runner only requires changing this file.
 */
export {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    afterAll,
    afterEach,
    vi,
} from 'vitest';
