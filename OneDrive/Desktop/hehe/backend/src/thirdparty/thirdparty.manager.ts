import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ThirdPartyAbstract, ThirdPartyParams } from './thirdparty.interface';

@Injectable()
export class ThirdPartyManager {
  constructor(private readonly moduleRef: ModuleRef) {}

  getAllProviders(): Pick<ThirdPartyParams, 'identifier' | 'title' | 'description' | 'fields'>[] {
    return (Reflect.getMetadata('third:party', ThirdPartyAbstract) || []).map(
      (p: any) => ({
        identifier: p.identifier,
        title: p.title,
        description: p.description,
        fields: p.fields || [],
      }),
    );
  }

  getProvider(
    identifier: string,
  ): (ThirdPartyParams & { instance: ThirdPartyAbstract }) | undefined {
    const entry = (
      Reflect.getMetadata('third:party', ThirdPartyAbstract) || []
    ).find((p: any) => p.identifier === identifier);

    if (!entry) return undefined;

    return {
      ...entry,
      instance: this.moduleRef.get(entry.target, { strict: false }),
    };
  }
}
