/**
 *
 */
export interface Plugins<S> {}
export const plugins: Plugins<any> = {} as any;

import { modules } from './modules';
import { states } from './states';

plugins.modules = modules;
plugins.states = states;

import './modules';
import './states';
