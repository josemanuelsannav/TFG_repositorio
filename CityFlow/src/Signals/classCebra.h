
#ifndef CLASSCEBRA_H
#define CLASSCEBRA_H

#include "mySignal.h"
#include <string>


namespace CityFlow
{
    class ClassCebra : public mySignal
    {
    public:
        std::string id;
        std::string road;
        bool is_activated;
        int contador_cebra;
        int pos_x;
        int pos_y;
        std::string direccion;
        int contador_volver_a_parar;
        Engine *engine; 

    public:
        ClassCebra(const std::string &id, const std::string &road, int pos_x, int pos_y, const std::string &direccion);
        double affectVehicle(Vehicle &vehicle, double v) override;
        void addEngine(Engine *engine);
    };
}
#endif // CEBRA_H