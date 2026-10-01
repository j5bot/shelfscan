// typescript-eslint (pulled in by eslint-config-next) needs the JS compiler API that
// TypeScript 7 no longer ships. eslint-config-next takes typescript as a peer, which pnpm
// always resolves from the root (7), so make it a regular dependency on TypeScript 6 instead;
// lint keeps TypeScript 6 until typescript-eslint supports 7
const LINT_TYPESCRIPT = '6.0.3';

const readPackage = (pkg) => {
    if (pkg.name === 'eslint-config-next') {
        delete pkg.peerDependencies?.typescript;
        delete pkg.peerDependenciesMeta?.typescript;
        pkg.dependencies = { ...pkg.dependencies, typescript: LINT_TYPESCRIPT };
    }
    return pkg;
};

module.exports = { hooks: { readPackage } };
