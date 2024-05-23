#ifndef CLASSCEDA_H
#define CLASSCEDA_H

#include "mySignal.h"
#include <string>


namespace CityFlow
{
    class ClassCeda : public mySignal
    {
    public:
        std::string id;
        std::string road;
        int pos_x;
        int pos_y;
        std::string direccion;
        Engine *engine;
    public:
        ClassCeda(const std::string &id, const std::string &road, int pos_x, int pos_y, const std::string &direccion);
        double affectVehicle(Vehicle &vehicle, double v) override;
        void addEngine(Engine *engine);
        bool estaEnCeda(Vehicle &vehicle);
        bool hayCochesViniendo(Vehicle &vehicle);
        bool estaEncimaCeda(Vehicle &vehicle);
    };
}
#endif // CEBRA_H