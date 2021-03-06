import {
  Package,
  createComposedProjectPlugin,
  createProjectTestPlugin,
} from '@sewing-kit/plugins';
import {babelConfigurationHooks} from '@sewing-kit/plugin-babel';
import {jestConfigurationHooks} from '@sewing-kit/plugin-jest';
import {javascript} from '@sewing-kit/plugin-javascript';
import {typescript} from '@sewing-kit/plugin-typescript';
import {buildFlexibleOutputs} from '@sewing-kit/plugin-package-flexible-outputs';

const jestRemoveBabelPresetModuleMapperPlugin = createRemoveSourceMappingPlugin();

export const createSewingKitPackagePlugin = ({typesAtRoot = false} = {}) =>
  createComposedProjectPlugin<Package>('SewingKit.InternalPackage', [
    babelConfigurationHooks,
    jestConfigurationHooks,
    jestRemoveBabelPresetModuleMapperPlugin,
    javascript(),
    typescript(),
    buildFlexibleOutputs({
      node: false,
      esmodules: false,
      esnext: false,
      commonjs: true,
      binaries: true,
      typescript: {typesAtRoot},
    }),
  ] as const);

// We use the internal babel preset to compile tests. As part of bootstrap,
// we already handle this package a bit differently; we build its source
// so a valid CommonJS representation exists for Babel to use. This is the
// last part of that: the jest plugin automatically adds a module name
// mapper for the package to map the module to its source, but that will
// also catch the attempted use of the plugin for Babel compiling the
// tests, which won't work because it's the source, not CommonJS. This
// just removes the name mapping so any references to this package
// point at the compiled output, which is a sloppy but workable solution.

function createRemoveSourceMappingPlugin() {
  return createProjectTestPlugin<Package>(
    'SewingKit.InternalRemoveBabelPresetJestModuleMapper',
    ({hooks}) => {
      hooks.configure.hook(({jestModuleMapper}) => {
        jestModuleMapper?.hook(
          ({'@sewing-kit/babel-preset$': _, ...rest}) => rest,
        );
      });
    },
  );
}
