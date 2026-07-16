// structuredClone is a Node >= 17 global; not part of the ES2022 lib types and
// we deliberately avoid pulling in the full @types/node surface (the engine is
// platform-agnostic by policy).
declare function structuredClone<T>(value: T): T;
