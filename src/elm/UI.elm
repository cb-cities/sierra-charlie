module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, div)
import Html.Attributes exposing (id, style)
import Signal exposing (Address)
import StartApp exposing (App)
import Task exposing (Task)


type alias Model =
  { loadingProgress : Float
  }


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  }


type Action =
    Idle
  | SetLoadingProgress Float


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


view : Address Action -> Model -> Html
view address model =
    div []
      [ div
          [ id "ui-load-progress-track"
          , style
              [ ("opacity", if model.loadingProgress == 100 then "0" else "1")
              ]
          ]
          [ div
            [ id "ui-load-progress-bar"
            , style
                [ ("width", toString model.loadingProgress ++ "%")
                ]
            ]
            []
          ]
      ]


init : (Model, Effects Action)
init =
    (defaultModel, Task.succeed Idle |> Effects.task)


port setLoadingProgress : Signal Float


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map SetLoadingProgress setLoadingProgress
          ]
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


main : Signal Html
main =
    app.html
