module Special exposing (..)

import Task exposing (Task)
import Native.Special


send : String -> Task x ()
send =
    Native.Special.send
