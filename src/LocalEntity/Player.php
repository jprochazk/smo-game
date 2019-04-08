<?php


namespace App\LocalEntity;


class Player
{
    private $UUID;
    private $connectionId;
    private $posX;
    private $posY;

    public function __construct($connectionId, $UUID, $pos)
    {
        $this->connectionId = $connectionId;
        $this->UUID = $UUID;
        $this->posX = $pos->x;
        $this->posY = $pos->y;
    }

    public function getJSON($type, $event) {
        return json_encode([
            'type' => $type,
            'event' => $event,
            'data' => [
                'type' => 'player',
                'UUID' => $this->UUID,
                'pos' => [
                    'x' => $this->posX,
                    'y' => $this->posY
                ]
            ]
        ]);
    }

    public function getUUID()
    {
        return $this->UUID;
    }

    public function getConnectionId()
    {
        return $this->connectionId;
    }

    public function getPosX()
    {
        return $this->posX;
    }

    public function getPosY()
    {
        return $this->posY;
    }

    public function updatePos($pos) {
        $this->posX = $pos->x;
        $this->posY = $pos->y;
    }


}