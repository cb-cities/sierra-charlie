module UI where

import Effects exposing (Effects, Never, none)
import Html exposing (Html)
import Signal exposing (Address, Mailbox)
import StartApp exposing (App)
import Task exposing (Task, andThen)

import Types exposing (..)
import View exposing (view)


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  , highlightedFeature = Nothing
  , selectedFeature = Nothing
  }


init : (Model, Effects Action)
init =
    (defaultModel, Effects.task (Task.succeed Idle))


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of
      Idle ->
        (model, none)
      SetLoadingProgress progress ->
        ({model | loadingProgress = progress}, none)
      SetHighlightedFeature feature ->
        ({model | highlightedFeature = feature}, none)
      SetSelectedFeature feature ->
        ({model | selectedFeature = feature}, none)
      HighlightFeature toid ->
        (model, send highlightFeatureMailbox.address toid)
      SelectFeature toid ->
        (model, send selectFeatureMailbox.address toid)


send : Address a -> a -> Effects Action
send address message =
    Effects.task (Signal.send address message `andThen` \_ -> Task.succeed Idle)


ui : App Model
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
