module UI where

import Effects exposing (Effects, Never, none)
import Html exposing (Html)
import Signal exposing (Address, Mailbox)
import StartApp exposing (App)
import Task exposing (Task, andThen)

import Types exposing (..)
import View exposing (view)


initialState : State
initialState =
  { mode = Nothing
  , loadingProgress = 0
  , highlightedFeature = Nothing
  , selectedFeature = Nothing
  }


init : (State, Effects Action)
init =
    (initialState, Effects.task (Task.succeed Idle))


update : Action -> State -> (State, Effects Action)
update action state =
    case action of
      Idle ->
        (state, none)
      ReceiveMode mode ->
        ({state | mode = mode}, none)
      ReceiveLoadingProgress progress ->
        ({state | loadingProgress = progress}, none)
      ReceiveHighlightedFeature feature ->
        ({state | highlightedFeature = feature}, none)
      ReceiveSelectedFeature feature ->
        ({state | selectedFeature = feature}, none)
      SetMode mode ->
        (state, send setModeMailbox.address mode)
      HighlightFeature toid ->
        (state, send highlightFeatureMailbox.address toid)
      SelectFeature toid ->
        (state, send selectFeatureMailbox.address toid)


send : Address a -> a -> Effects Action
send address message =
    Effects.task (Signal.send address message `andThen` \_ -> Task.succeed Idle)


ui : App State
ui =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map ReceiveMode mode
          , Signal.map ReceiveLoadingProgress loadingProgress
          , Signal.map ReceiveHighlightedFeature highlightedFeature
          , Signal.map ReceiveSelectedFeature selectedFeature
          ]
      }


port mode : Signal (Maybe String)


port loadingProgress : Signal Float


port highlightedFeature : Signal (Maybe Feature)


port selectedFeature : Signal (Maybe Feature)


port setMode : Signal (Maybe String)
port setMode =
    setModeMailbox.signal


port highlightFeature : Signal (Maybe String)
port highlightFeature =
    highlightFeatureMailbox.signal


port selectFeature : Signal (Maybe String)
port selectFeature =
    selectFeatureMailbox.signal


setModeMailbox : Mailbox (Maybe String)
setModeMailbox =
    Signal.mailbox Nothing


highlightFeatureMailbox : Mailbox (Maybe String)
highlightFeatureMailbox =
    Signal.mailbox Nothing


selectFeatureMailbox : Mailbox (Maybe String)
selectFeatureMailbox =
    Signal.mailbox Nothing


port tasks : Signal (Task Never ())
port tasks =
    ui.tasks


main : Signal Html
main =
    ui.html
