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

    this.connection = await Connection.connect({
      address: process.env.TEMPORAL_SERVER_URL ?? 'localhost:7233',
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
