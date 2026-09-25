import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Live GPS Tracking: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeVehicle')
  handleSubscribeVehicle(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { vehicleId: string },
  ) {
    if (payload?.vehicleId) {
      client.join(`vehicle_${payload.vehicleId}`);
      this.logger.log(`Client ${client.id} subscribed to room vehicle_${payload.vehicleId}`);
    }
  }

  broadcastLocationUpdate(vehicleId: string, lat: number, lng: number) {
    const data = {
      vehicleId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    };
    // Public simulated demo fleet: one event per update, without duplicate room broadcasts.
    this.server.emit('vehicleLocationUpdate', data);
  }
}
