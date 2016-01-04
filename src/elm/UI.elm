module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, div, text)
import Html.Attributes exposing (id, style)
import Signal exposing (Address)
import StartApp exposing (App)
import Task exposing (Task)


type alias Model =
  { loadingProgress : Float
  , hoveredToid : Maybe String
  , selectedToid : Maybe String
  }


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  , hoveredToid = Nothing
  , selectedToid = Nothing
  }


type Action =
    Idle
  | SetLoadingProgress Float
  | SetHoveredToid (Maybe String)
  | SetSelectedToid (Maybe String)


noEffect : Model -> (Model, Effects Action)
noEffect model =
    (model, Effects.none)


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of
      Idle ->
        noEffect model
      SetLoadingProgress newProgress ->
        {model | loadingProgress = max 0 newProgress}
          |> noEffect
      SetHoveredToid newToid ->
        {model | hoveredToid = newToid}
          |> noEffect
      SetSelectedToid newToid ->
        {model | selectedToid = newToid}
          |> noEffect


view : Address Action -> Model -> Html
view address model =
    div []
      [ div
          [ id "ui-loading-progress-track"
          , style
              [ ("opacity", if model.loadingProgress == 100 then "0" else "1")
              ]
          ]
          [ div
            [ id "ui-loading-progress-bar"
            , style
                [ ("width", toString model.loadingProgress ++ "%")
                ]
            ]
            []
          ]
      , div
          [ id "ui-status-area"
          ]
          [ div []
              [ case model.hoveredToid of
                  Nothing ->
                    text ""
                  Just toid ->
                    text toid
              ]
          , div []
              [ case model.selectedToid of
                  Nothing ->
                    text ""
                  Just toid ->
                    text toid
              ]
          ]
      ]


init : (Model, Effects Action)
init =
    (defaultModel, Task.succeed Idle |> Effects.task)


port setLoadingProgress : Signal Float
port setHoveredToid : Signal (Maybe String)
port setSelectedToid : Signal (Maybe String)


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map SetLoadingProgress setLoadingProgress
          , Signal.map SetHoveredToid setHoveredToid
          , Signal.map SetSelectedToid setSelectedToid
          ]
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


main : Signal Html
main =
    app.html
