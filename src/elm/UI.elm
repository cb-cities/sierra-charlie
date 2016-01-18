module UI where

import Effects exposing (Effects, Never, none)
import Html exposing (Html)
import Signal exposing (Address, Mailbox)
import StartApp exposing (App)
import Task exposing (Task, andThen)

import Export
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
    ExportRoutes ->
      (state, exportRoutes state.routes)
    ExportAdjustment ->
      (state, exportAdjustment state.adjustment)


exportRoutes : List Route -> Effects Action
exportRoutes routes =
  Effects.task
    ( Export.viaBlobURL routes
      `andThen`
      \_ -> Task.succeed Idle
    )


exportAdjustment : Maybe Adjustment -> Effects Action
exportAdjustment maybeAdjustment =
  Effects.task
    ( Export.viaBlobURL maybeAdjustment
      `andThen`
      \_ -> Task.succeed Idle
    )


type alias EncodedIncomingMessage =
  { tag : String
  , mode : Maybe String
  , loadingProgress : Float
  , feature : Maybe Feature
  , routes : List Route
  , adjustment : Maybe Adjustment
  }


decodeIncomingMessage : Maybe EncodedIncomingMessage -> Action
decodeIncomingMessage maybeEncoded =
  case maybeEncoded of
    Nothing ->
      Idle
    Just encoded ->
      case encoded.tag of
        "UpdateMode" ->
          Receive (UpdateMode encoded.mode)
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


encode : String -> EncodedOutgoingMessage
encode tag =
  { tag = tag
  , mode = Nothing
  , toid = Nothing
  }


encodeTOID : String -> Maybe String -> EncodedOutgoingMessage
encodeTOID tag toid =
  let
    base = encode tag
  in
    {base | toid = toid}


encodeOutgoingMessage : OutgoingMessage -> EncodedOutgoingMessage
encodeOutgoingMessage message =
  case message of
    SetMode mode ->
      let
        base = encode "SetMode"
      in
        {base | mode = mode}
    HighlightFeatureByTOID toid ->
      encodeTOID "HighlightFeatureByTOID" toid
    SelectFeatureByTOID toid ->
      encodeTOID "SelectFeatureByTOID" toid
    DeleteSelectedFeature ->
      encode "DeleteSelectedFeature"
    UndeleteSelectedFeature ->
      encode "UndeleteSelectedFeature"
    ClearRoutes ->
      encode "ClearRoutes"
    ClearAdjustment ->
      encode "ClearAdjustment"


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
