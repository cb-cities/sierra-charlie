module UI where

import Effects exposing (Effects, Never, none)
import Html exposing (Html)
import Signal exposing (Address, Mailbox)
import StartApp exposing (App)
import Task exposing (Task, andThen)

import Special
import Types exposing (..)
import View exposing (view)


defaultState : State
defaultState =
  { mode = Nothing
  , loadingProgress = 0
  , highlightedFeature = Nothing
  , selectedFeature = Nothing
  , routes = []
  , adjustment = Nothing
  }


update : Action -> State -> (State, Effects Action)
update action state =
  case action of
    Idle ->
      (state, none)
    Receive (UpdateMode mode) ->
      ({state | mode = mode}, none)
    Receive (UpdateLoadingProgress progress) ->
      ({state | loadingProgress = progress}, none)
    Receive (UpdateHighlightedFeature feature) ->
      ({state | highlightedFeature = feature}, none)
    Receive (UpdateSelectedFeature feature) ->
      ({state | selectedFeature = feature}, none)
    Receive (UpdateRoutes routes) ->
      ({state | routes = routes}, none)
    Receive (UpdateAdjustment adjustment) ->
      ({state | adjustment = adjustment}, none)
    Send message ->
      (state, send message)
    SendSpecial tag ->
      (state, sendSpecial tag)


type alias EncodedIncomingMessage =
  { tag : String
  , mode : Maybe String
  , loadingProgress : Float
  , feature : Maybe Feature
  , routes : List Route
  , adjustment : Maybe Adjustment
  }


decodeMode : Maybe String -> Maybe Mode
decodeMode maybeEncoded =
  case maybeEncoded of
    Nothing ->
      Nothing
    Just encoded ->
      case encoded of
        "GetRoute" ->
          Just GetRoute
        "AskGoogleForRoute" ->
          Just AskGoogleForRoute
        _ ->
          Debug.crash ("Invalid mode: " ++ toString encoded)


decodeIncomingMessage : Maybe EncodedIncomingMessage -> Action
decodeIncomingMessage maybeEncoded =
  case maybeEncoded of
    Nothing ->
      Idle
    Just encoded ->
      case encoded.tag of
        "UpdateMode" ->
          Receive (UpdateMode (decodeMode encoded.mode))
        "UpdateLoadingProgress" ->
          Receive (UpdateLoadingProgress encoded.loadingProgress)
        "UpdateHighlightedFeature" ->
          Receive (UpdateHighlightedFeature encoded.feature)
        "UpdateSelectedFeature" ->
          Receive (UpdateSelectedFeature encoded.feature)
        "UpdateRoutes" ->
          Receive (UpdateRoutes encoded.routes)
        "UpdateAdjustment" ->
          Receive (UpdateAdjustment encoded.adjustment)
        _ ->
          Debug.crash ("Invalid incoming message: " ++ toString encoded)


port incomingMessage : Signal (Maybe EncodedIncomingMessage)


incomingAction : Signal Action
incomingAction =
  Signal.map decodeIncomingMessage incomingMessage


type alias EncodedOutgoingMessage =
  { tag : String
  , mode : Maybe String
  , toid : Maybe String
  }


encodeMode : Maybe Mode -> Maybe String
encodeMode maybeMode =
  case maybeMode of
    Nothing ->
      Nothing
    Just mode ->
      case mode of
        GetRoute ->
          Just "GetRoute"
        AskGoogleForRoute ->
          Just "AskGoogleForRoute"


encodeMessage : String -> EncodedOutgoingMessage
encodeMessage tag =
  { tag = tag
  , mode = Nothing
  , toid = Nothing
  }


encodeModeMessage : String -> Maybe Mode -> EncodedOutgoingMessage
encodeModeMessage tag mode =
  let
    base = encodeMessage tag
  in
    {base | mode = encodeMode mode}


encodeTOIDMessage : String -> Maybe String -> EncodedOutgoingMessage
encodeTOIDMessage tag toid =
  let
    base = encodeMessage tag
  in
    {base | toid = toid}


encodeOutgoingMessage : OutgoingMessage -> EncodedOutgoingMessage
encodeOutgoingMessage message =
  case message of
    SetMode mode ->
      encodeModeMessage "SetMode" mode
    HighlightFeatureByTOID toid ->
      encodeTOIDMessage "HighlightFeatureByTOID" toid
    SelectFeatureByTOID toid ->
      encodeTOIDMessage "SelectFeatureByTOID" toid
    DeleteSelectedFeature ->
      encodeMessage "DeleteSelectedFeature"
    UndeleteSelectedFeature ->
      encodeMessage "UndeleteSelectedFeature"
    ClearRoutes ->
      encodeMessage "ClearRoutes"
    ClearAdjustment ->
      encodeMessage "ClearAdjustment"


outgoingMessageMailbox : Mailbox (Maybe EncodedOutgoingMessage)
outgoingMessageMailbox =
  Signal.mailbox Nothing


send : OutgoingMessage -> Effects Action
send message =
  let
    maybeEncoded = Just (encodeOutgoingMessage message)
  in
    Effects.task
      ( Signal.send outgoingMessageMailbox.address maybeEncoded
        `andThen`
        \_ -> Task.succeed Idle
      )


encodeSpecialOutgoingMessage : SpecialOutgoingMessage -> String
encodeSpecialOutgoingMessage message =
  case message of
    SaveRoutesAsJSON ->
      "SaveRoutesAsJSON"
    SaveAdjustmentAsJSON ->
      "SaveAdjustmentAsJSON"


sendSpecial : SpecialOutgoingMessage -> Effects Action
sendSpecial message =
  let
    encoded = encodeSpecialOutgoingMessage message
  in
    Effects.task
      ( Special.send encoded
        `andThen`
        \_ -> Task.succeed Idle
      )


port outgoingMessage : Signal (Maybe EncodedOutgoingMessage)
port outgoingMessage =
  outgoingMessageMailbox.signal


init : (State, Effects Action)
init =
  (defaultState, Effects.task (Task.succeed Idle))


ui : App State
ui =
  StartApp.start
    { init = init
    , update = update
    , view = view
    , inputs = [incomingAction]
    }


port tasks : Signal (Task Never ())
port tasks =
  ui.tasks


main : Signal Html
main =
  ui.html
