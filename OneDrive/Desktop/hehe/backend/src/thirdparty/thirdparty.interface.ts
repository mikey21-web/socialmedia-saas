import { Injectable } from '@nestjs/common';

export abstract class ThirdPartyAbstract<T = any> {
  abstract checkConnection(
    apiKey: string,
  ): Promise<false | { name: string; username: string; id: string }>;
  abstract sendData(apiKey: string, data: T): Promise<string>;
  [key: string]: ((apiKey: string, data?: any) => Promise<any>) | undefined;
}

export interface ThirdPartyParams {
  identifier: string;
  title: string;
  description: string;
  position: 'media' | 'media-library' | 'webhook';
  fields: {
    name: string;
    description: string;
    type: string;
    placeholder: string;
    validation?: RegExp;
  }[];
}

export function ThirdParty(params: ThirdPartyParams) {
  return function (target: any) {
    Injectable()(target);

    const existingMetadata =
      Reflect.getMetadata('third:party', ThirdPartyAbstract) || [];

    existingMetadata.push({ target, ...params });

    Reflect.defineMetadata('third:party', existingMetadata, ThirdPartyAbstract);
  };
}
