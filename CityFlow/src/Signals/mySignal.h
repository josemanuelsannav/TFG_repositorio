
#ifndef MYSIGNAL_H
#define MYSIGNAL_H

#include "vehicle/vehicle.h"

namespace CityFlow
{
    class mySignal
    {
    public:
        virtual ~mySignal() = default;
        virtual double affectVehicle(Vehicle &vehicle, double v) = 0;
        virtual void addEngine(Engine *engine) = 0;
    };
}
#endif