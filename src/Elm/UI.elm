module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, button, div, input, li, span, text, ul)
import Html.Attributes exposing (style)
import Html.Events exposing (onClick)
import Result exposing (Result)
import Signal exposing (Address, Mailbox)
import StartApp exposing (App)
import Task exposing (Task)


---- MODEL ----


type alias Model =
  { left : Float
  , top : Float
  , zoom : Float
  }


defaultModel : Model
defaultModel =
  { left = 0.4897637424698795
  , top = 0.4768826844262295
  , zoom = 6
  }


minZoom = 0
maxZoom = 8


---- UPDATE ----


type Action =
    Idle
  | SetZoom Float
  | IncreaseZoom
  | DecreaseZoom


noEffect : Model -> (Model, Effects Action)
noEffect model =
    (model, Effects.none)


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of 
      Idle ->
        noEffect model
      SetZoom zoom ->
        noEffect <|
          if zoom >= minZoom && zoom <= maxZoom
            then {model | zoom = zoom}
            else model
      IncreaseZoom ->
        noEffect <|
          if model.zoom > minZoom
            then {model | zoom = model.zoom - 1}
            else model
      DecreaseZoom ->
        noEffect <|
          if model.zoom < maxZoom
            then {model | zoom = model.zoom + 1}
            else model


---- VIEW ----


view : Address Action -> Model -> Html
view address model =
    div [style [("color", "#fff")]]
        [ div []
          [ text ("Left: " ++ toString model.left)
          , button [] [text "⇦"]
          , button [] [text "←"]
          , button [] [text "→"]
          , button [] [text "⇨"]
          ]
        , div []
          [ text (" Top: " ++ toString model.top)
          , button [] [text "⇧"]
          , button [] [text "↑"]
          , button [] [text "↓"]
          , button [] [text "⇩"]
          ]
        , div []
          [ text (" Scale: 1/2^" ++ toString model.zoom)
          , button [onClick address (SetZoom 0)] [text "0"]
          , button [onClick address (SetZoom 1)] [text "1"]
          , button [onClick address (SetZoom 2)] [text "2"]
          , button [onClick address (SetZoom 3)] [text "3"]
          , button [onClick address (SetZoom 4)] [text "4"]
          , button [onClick address (SetZoom 5)] [text "5"]
          , button [onClick address (SetZoom 6)] [text "6"]
          , button [onClick address (SetZoom 7)] [text "7"]
          , button [onClick address (SetZoom 8)] [text "8"]
          , button [onClick address DecreaseZoom] [text "−"]
          , button [onClick address IncreaseZoom] [text "+"]
          ]
        ]


---- INPUTS ----


port getState : Maybe Model


init : (Model, Effects Action)
init =
    ( Maybe.withDefault defaultModel getState
    , Effects.task (Task.succeed Idle)
    )


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs = []
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


port setState : Signal Model
port setState =
    app.model


port setLeft : Signal Float
port setLeft =
    Signal.map .left app.model


port setTop : Signal Float
port setTop =
    Signal.map .top app.model


port setZoom : Signal Float
port setZoom =
    Signal.map .zoom app.model


main : Signal Html
main =
    app.html
