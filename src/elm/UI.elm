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
  { loadingProgress = 0
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
      SetLoadingProgress progress ->
        ({state | loadingProgress = progress}, none)
      SetHighlightedFeature feature ->
        ({state | highlightedFeature = feature}, none)
      SetSelectedFeature feature ->
        ({state | selectedFeature = feature}, none)
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
          [ Signal.map SetLoadingProgress loadingProgress
          , Signal.map SetHighlightedFeature highlightedFeature
          , Signal.map SetSelectedFeature selectedFeature
          ]
      }


port loadingProgress : Signal Float


port highlightedFeature : Signal (Maybe Feature)


port selectedFeature : Signal (Maybe Feature)


port highlightFeature : Signal (Maybe String)
port highlightFeature =
    highlightFeatureMailbox.signal


port selectFeature : Signal (Maybe String)
port selectFeature =
    selectFeatureMailbox.signal


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
