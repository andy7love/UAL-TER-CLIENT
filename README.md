# UAL-TER-CLIENT
Unmanned Aircraft Life - Terminal Client

## Objetives

### Connect to drone
+ Using wifi direct-ip
+ Using no-ip system to connect from internet
+ Handle/display connection ping and latency
+ Handle re-connect when connection is lost

### Receive status
#### Display in-flight information
+ Camera streaming
+ Altitude
+ IMU (all axis orientation)
+ Proximity (all axis obstacles)
+ DC Voltage
+ GPS (lat/long/altitude coordinates)
+ Indoor position (wifi triangulation)
+ Proximity alert
+ Low-bat alert
+ Relative movement
+ Indoor map

#### Request/display on-demand information
+ Modules initialization
+ Modules status
+ Entire snapshot status
+ Debug mode
+ Logs

### Send commands
#### Miscellaneous
+ System restart/shutdown
+ Emergency cut-off engines
+ Basic camera/lights on/off commands

#### Complete Manual Flight
+ Basic direct-Joystick commands such as x,y,z and thottle control surfaces values.

#### Assisted Manual Flight
+ Advanced flight attitudes such as heading, roll, pitch and altitude values.
+ Action commands such as maintain vertical/horizontal speed.
+ More advanced commands such as take-off, landing, hover.
+ Emergency hover.
 
#### Navigation Mode
+ Navigation commands such as GoTo (lattitude/longitude/altittude).
+ Navitation commands using waypoints.
+ Follow command.
