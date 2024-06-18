#include <iostream>
#include "classCebra.h"
namespace CityFlow
{
    ClassCebra::ClassCebra(const std::string &id, const std::string &road, int pos_x, int pos_y, const std::string &direccion)
        : id(id), road(road), pos_x(pos_x), pos_y(pos_y), direccion(direccion) {
            this->is_activated = false;
            this->contador_volver_a_parar = 0;
        }

    double ClassCebra::affectVehicle(Vehicle &vehicle , double v )
    {

        if (this->is_activated == true)
        {
            if ((this->pos_x - 24 <= vehicle.getPoint().x && this->pos_x - 8 >= vehicle.getPoint().x && this->pos_y - 12 <= vehicle.getPoint().y && this->pos_y >= vehicle.getPoint().y) || // carretera horizontal izquierda a derecha
                (this->pos_x <= vehicle.getPoint().x && this->pos_x + 12 >= vehicle.getPoint().x && this->pos_y - 30 <= vehicle.getPoint().y && this->pos_y - 8 >= vehicle.getPoint().y) || // carretera vertical abajo a arriba
                (this->pos_x + 8 <= vehicle.getPoint().x && this->pos_x + 24 >= vehicle.getPoint().x && this->pos_y <= vehicle.getPoint().y && this->pos_y + 12 >= vehicle.getPoint().y) || // carretera horizontal derecha a izquierda
                (this->pos_x - 12 <= vehicle.getPoint().x && this->pos_x >= vehicle.getPoint().x && this->pos_y + 8 <= vehicle.getPoint().y && this->pos_y + 30 >= vehicle.getPoint().y))   // carretera vertical arriba a abajo {
            {
                
                v = 0.0;
                if(vehicle.getId() == "flow_0_1"){
                    //std::cout << "Coche 0_1 tiene que pararse y la vel = "<<v << std::endl;
                }
            }
        }
        else
        {
            if (((this->pos_x - 24 <= vehicle.getPoint().x && this->pos_x - 12 >= vehicle.getPoint().x && this->pos_y - 12 <= vehicle.getPoint().y && this->pos_y >= vehicle.getPoint().y) ||
                 (this->pos_x <= vehicle.getPoint().x && this->pos_x + 12 >= vehicle.getPoint().x && this->pos_y - 24 <= vehicle.getPoint().y && this->pos_y - 12 >= vehicle.getPoint().y) ||
                 (this->pos_x + 12 <= vehicle.getPoint().x && this->pos_x + 24 >= vehicle.getPoint().x && this->pos_y <= vehicle.getPoint().y && this->pos_y + 12 >= vehicle.getPoint().y) ||
                 (this->pos_x - 12 <= vehicle.getPoint().x && this->pos_x >= vehicle.getPoint().x && this->pos_y + 12 <= vehicle.getPoint().y && this->pos_y + 24 >= vehicle.getPoint().y)) &&
                (vehicle.getLeader() != nullptr && vehicle.getLeader()->estaJustoDespuesDeCebra() == true))
            {
                if (vehicle.getLeader()->getLeader() != nullptr && (vehicle.getLeader()->getLeader()->getSpeed() < vehicle.getSpeed() || vehicle.getLeader()->getSpeed() == 0.0))
                {
                    //std::cout << "Cebra activada" << std::endl;
                    v=0.0;
                }
            }
        }
        return v;
    }

    void ClassCebra::addEngine(Engine *engine)
    {
        this->engine = engine;
    }
}