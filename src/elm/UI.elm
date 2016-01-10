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
      SendHoveredTOID toid ->
        (model, send toid toHoveredTOID.address)
      SendClickedTOID toid ->
        (model, send toid toClickedTOID.address)


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


port hoveredTOID : Signal (Maybe String)
port hoveredTOID =
    toHoveredTOID.signal


port clickedTOID : Signal (Maybe String)
port clickedTOID =
    toClickedTOID.signal


send : a -> Address a -> Effects Action
send message address =
    Effects.task (Signal.send address message `andThen` \_ -> Task.succeed Idle)


toHoveredTOID : Mailbox (Maybe String)
toHoveredTOID =
    Signal.mailbox Nothing


toClickedTOID : Mailbox (Maybe String)
toClickedTOID =
    Signal.mailbox Nothing


port tasks : Signal (Task Never ())
port tasks =
    ui.tasks


main : Signal Html
main =
    ui.html
