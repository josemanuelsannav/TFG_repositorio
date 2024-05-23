#ifndef CLASSSTOP_H
#define CLASSSTOP_H

#include "mySignal.h"
#include <string>

namespace CityFlow
{
    class ClassStop : public mySignal
    {
    public:
        std::string id;
        std::string road;
        int pos_x;
        int pos_y;
        std::string direccion;
        Engine *engine;
    public:
        ClassStop(const std::string &id, const std::string &road, int pos_x, int pos_y, const std::string &direccion);
        double affectVehicle(Vehicle &vehicle, double v) override;
        bool estaEnStop(Vehicle &vehicle);
        bool hayCochesViniendo(Vehicle &vehicle);
        void addEngine(Engine *engine); 
    };
}
#endif // STOP_H