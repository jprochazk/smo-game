<?php


namespace App\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use App\Messenger;

class WebsocketServerStartCommand extends Command
{
    protected static $defaultName = 'app:wss:run';

    protected function configure()
    {
        $this
            ->setDescription('Starts the websocket server.')
            ->setHelp('Starts the websocket server on port 8080.')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        try {
            $wsServer = new WsServer(new Messenger());
            $server = IoServer::factory(
                new HttpServer(
                    $wsServer
                ),
                8080
            );

            $wsServer->enableKeepAlive($server->loop, 5);

            $output->writeln(' ');
            $output->writeln(' [OK] Websocket server listening on port 8080.');
            $output->writeln(' ');
            $output->writeln('Press [CTRL+C] to stop the server.');
            $output->writeln(' ');
            $output->writeln('Log: ');
            $output->writeln(' ');
            $server->run();
        } catch(\Exception $e) {
            $output->writeln($e->getMessage());
        }
    }
}