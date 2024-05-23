#ifndef CLASSNOTSIGNAL_H
#define CLASSNOTSIGNAL_H

#include "mySignal.h"
#include <string>


namespace CityFlow
{
    class ClassNotSignal : public mySignal
    {
    public:
        std::string id;
        std::string road;
        int pos_x;
        int pos_y;
        std::string direccion;
        Engine *engine;
    public:
        ClassNotSignal(const std::string &id, const std::string &road, int pos_x, int pos_y, const std::string &direccion);
        double affectVehicle(Vehicle &vehicle, double v) override;
        void addEngine(Engine *engine);
        bool calleSinSenal(Vehicle &vehicle);
    };
}
#endif 