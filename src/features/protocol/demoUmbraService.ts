import type { UmbraService } from './umbraService.types';
import { createDemoUmbraGateway } from './demoUmbraGateway';
import { createUmbraService } from './umbraService';

export const demoUmbraService: UmbraService = createUmbraService(createDemoUmbraGateway());
