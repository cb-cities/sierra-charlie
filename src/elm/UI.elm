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
  , routes = []
  , adjustment = Nothing
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
      ReceiveRoutes routes ->
        ({state | routes = routes}, none)
      ReceiveAdjustment adjustment ->
        ({state | adjustment = adjustment}, none)
      SetMode mode ->
        (state, send setModeMailbox.address mode)
      HighlightFeature toid ->
        (state, send highlightFeatureMailbox.address toid)
      SelectFeature toid ->
        (state, send selectFeatureMailbox.address toid)
      DeleteSelectedFeature ->
        (state, send deleteSelectedFeatureMailbox.address ())
      UndeleteSelectedFeature ->
        (state, send undeleteSelectedFeatureMailbox.address ())
      ClearRoutes ->
        (state, send clearRoutesMailbox.address ())
      ClearAdjustment ->
        (state, send clearAdjustmentMailbox.address ())


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
          , Signal.map ReceiveRoutes routes
          , Signal.map ReceiveAdjustment adjustment
          ]
      }


port mode : Signal (Maybe String)


port loadingProgress : Signal Float


port highlightedFeature : Signal (Maybe Feature)


port selectedFeature : Signal (Maybe Feature)


port routes : Signal (List Route)


port adjustment : Signal (Maybe Adjustment)


port setMode : Signal (Maybe String)
port setMode =
    setModeMailbox.signal


port highlightFeature : Signal (Maybe String)
port highlightFeature =
    highlightFeatureMailbox.signal


port selectFeature : Signal (Maybe String)
port selectFeature =
    selectFeatureMailbox.signal


port deleteSelectedFeature : Signal ()
port deleteSelectedFeature =
    deleteSelectedFeatureMailbox.signal


port undeleteSelectedFeature : Signal ()
port undeleteSelectedFeature =
    undeleteSelectedFeatureMailbox.signal


port clearRoutes : Signal ()
port clearRoutes =
    clearRoutesMailbox.signal


port clearAdjustment : Signal ()
port clearAdjustment =
    clearAdjustmentMailbox.signal


setModeMailbox : Mailbox (Maybe String)
setModeMailbox =
    Signal.mailbox Nothing


highlightFeatureMailbox : Mailbox (Maybe String)
highlightFeatureMailbox =
    Signal.mailbox Nothing


selectFeatureMailbox : Mailbox (Maybe String)
selectFeatureMailbox =
    Signal.mailbox Nothing


deleteSelectedFeatureMailbox : Mailbox ()
deleteSelectedFeatureMailbox =
    Signal.mailbox ()


undeleteSelectedFeatureMailbox : Mailbox ()
undeleteSelectedFeatureMailbox =
    Signal.mailbox ()


clearRoutesMailbox : Mailbox ()
clearRoutesMailbox =
    Signal.mailbox ()


clearAdjustmentMailbox : Mailbox ()
clearAdjustmentMailbox =
    Signal.mailbox ()


port tasks : Signal (Task Never ())
port tasks =
    ui.tasks


main : Signal Html
main =
    ui.html
