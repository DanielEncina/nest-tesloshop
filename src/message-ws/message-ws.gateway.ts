import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessageWsService } from './message-ws.service';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessageWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messageWsService: MessageWsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messageWsService.registerClient(client, payload.id);
    } catch (error) {
      client.disconnect();
      return;
    }

    // console.log({ payload });
    this.wss.emit(
      'clients-updated',
      this.messageWsService.getConnectedClients(),
    );

    // console.log({ conectados: this.messageWsService.getConnectedClients() });
  }

  handleDisconnect(client: Socket) {
    // console.log('client disconnected', client.id);
    this.messageWsService.removeClient(client.id);

    // console.log({ conectados: this.messageWsService.getConnectedClients() });
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto): void {
    // client.emit('message-from-server', {
    //   fullName: 'Soy YO!',
    //   message: payload.message || 'No me enviaste nada :(',
    // });

    // client.broadcast.emit('message-from-server', {
    //   fullName: 'Soy YO!',
    //   message: payload.message || 'No me enviaste nada :(',
    // });

    this.wss.emit('message-from-server', {
      fullName: this.messageWsService.getUserFullName(client.id),
      message: payload.message || 'No me enviaste nada :(',
    });
  }
}
