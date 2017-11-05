port module Ports exposing (..)

import Types exposing (EncodedIncomingMessage, EncodedOutgoingMessage)


port incomingMessage : (Maybe EncodedIncomingMessage -> msg) -> Sub msg


port outgoingMessage : Maybe EncodedOutgoingMessage -> Cmd msg
