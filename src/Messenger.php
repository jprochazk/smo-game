<?php


namespace App;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

use App\LocalEntity\Player;

class Messenger implements MessageComponentInterface
{
    /** @var \SplObjectStorage */
    protected $clients;

    /** @var Player[] */
    protected $players;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->players = [];
    }

    function onMessage(ConnectionInterface $from, $msg): void
    {
        try {
            $decodedMsg = json_decode($msg);
            if($decodedMsg->type === 'post') {
                if($decodedMsg->request === 'move') {
                    $currPlayer = $this->players[$from->resourceId];
                    $currPlayer->updatePos($decodedMsg->data->pos);

                    $data = $currPlayer->getJSON('update', 'entityMove');

                    foreach($this->clients as $client) {
                        if($client->resourceId !== $from->resourceId) {
                            $client->send($data);
                        }
                    }
                    return;
                }
                else if($decodedMsg->request === 'register') {
                    $newPlayer = new Player($from->resourceId, $decodedMsg->data->playerUUID, $decodedMsg->data->pos);
                    $this->players[$from->resourceId] = $newPlayer;
                    echo "New player {$newPlayer->getUUID()} at connection id {$from->resourceId}.\n";
                    echo "Redirecting data to all other players\n";
                    $count = 0;
                    foreach($this->clients as $client) {
                        if($client !== $from) {
                            $client->send($newPlayer->getJSON('update', 'entityData'));
                            ++$count;
                        }
                    }
                    echo sprintf(
                        "Redirected data to %d other player%s\n",
                        $count,
                        ($count == 1) ? '' : 's'
                    );
                    return;
                }
                return;
            }

            else if($decodedMsg->type === 'get') {
                echo "Connection id {$from->resourceId} requesting player data\n";
                if($decodedMsg->request === 'player') {
                    foreach($this->players as $player) {
                        if($player->getConnectionId() !== $from->resourceId) {
                            $encodedMsg = $player->getJSON('update', 'entityData');
                            $from->send($encodedMsg);
                        }
                    }
                }
                return;
            }
        } catch(\Exception $e) {
            echo $e->getMessage();
        }
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection to send messages to later
        $this->clients->attach($conn);
        $conn->send(json_encode(['connectionId' => $conn->resourceId]));

        echo "New connection id {$conn->resourceId}\n";
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        $player = $this->players[$conn->resourceId];
        if($player !== null) {
            foreach($this->clients as $client) {
                $client->send(json_encode([
                    'type' => 'update',
                    'event' => 'entityDelete',
                    'data' => [
                        'type' => 'player',
                        'UUID' => $player->getUUID()
                    ]
                ]));
            }
        }
        unset($this->players[$conn->resourceId]);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
}