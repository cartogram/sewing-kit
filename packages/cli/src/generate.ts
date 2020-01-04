import {SeriesHook, WaterfallHook} from '@sewing-kit/hooks';
import {
  GenerateTaskOptions,
  GenerateWorkspaceTaskHooks,
} from '@sewing-kit/tasks';

import {run} from './runner';
import {
  createCommand,
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
} from './common';

export const generate = createCommand({}, async (options, context) => {
  await runGenerate(context, options);
});

export async function runGenerate(
  context: TaskContext,
  options: GenerateTaskOptions,
) {
  const {workspace, ui} = context;

  const {generate} = await createWorkspaceTasksAndApplyPlugins(context);

  const hooks: GenerateWorkspaceTaskHooks = {
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
  };

  const type = await ui.ask('what do you want to generate?', {
    default: 'component',
    required: true,
  });

  console.log('answer', type)

  await generate.run({
    hooks,
    options: {type, ...options},
  });

  const configuration = await hooks.configureHooks.run({});
  await hooks.configure.run(configuration);

  const pre = await hooks.pre.run([], {configuration});
  const steps = await hooks.steps.run([], {
    configuration,
  });
  const post = await hooks.post.run([], {
    configuration,
  });

  await run(context, {
    title: 'generate',
    pre,
    post,
    steps: steps.map((step) => ({step, target: workspace})),
    epilogue(log) {
      log((fmt) => fmt`{success generate completed successfully!}`);
    },
  });
}
