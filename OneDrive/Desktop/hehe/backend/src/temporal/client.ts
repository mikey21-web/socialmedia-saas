import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

@Injectable()
export class TemporalClientService implements OnModuleDestroy {
  private connection?: Connection;
  private client?: Client;

  async getClient() {
    if (this.client) {
      return this.client;
    }

    const address = process.env.TEMPORAL_ADDRESS ?? process.env.TEMPORAL_SERVER_URL;
    if (!address || address.includes('localhost') || address.includes('127.0.0.1')) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid TEMPORAL_ADDRESS in production: localhost addresses are not allowed');
      }
    }

    this.connection = await Connection.connect({
      address: address ?? 'localhost:7233',
    });

    this.client = new Client({
      connection: this.connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    });

    return this.client;
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
