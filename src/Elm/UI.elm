module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, button, div, input, li, span, text, ul)
import Html.Attributes exposing (id, style)
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
  , vertexCount : Int
  }


defaultModel : Model
defaultModel =
  { left = 0.4897637424698795
  , top = 0.4768826844262295
  , zoom = 6
  , vertexCount = 0
  }


maxZoom : Float
maxZoom = 8


---- UPDATE ----


type Action =
    Idle
  | SetZoom Float
  | IncreaseZoom
  | DecreaseZoom
  | SetVertexCount Int


noEffect : Model -> (Model, Effects Action)
noEffect model =
    (model, Effects.none)


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of 
      Idle ->
        noEffect model
      SetZoom newZoom ->
        {model | zoom = max 0 (min newZoom maxZoom)}
          |> noEffect
      IncreaseZoom ->
        {model | zoom = max 0 (model.zoom - 1)}
          |> noEffect
      DecreaseZoom ->
        {model | zoom = min (model.zoom + 1) maxZoom}
          |> noEffect
      SetVertexCount newCount ->
        {model | vertexCount = max 0 newCount}
          |> noEffect


---- VIEW ----


view : Address Action -> Model -> Html
view address model =
    let
      loadProgress = toFloat model.vertexCount / toFloat maxVertexCount * 100
      loadDone = model.vertexCount == maxVertexCount
      
    in
      div [style [("color", "#f00")]]
        [ div
            [ id "ui-load-progress-track"
            , style
                [ ("opacity", if loadDone then "0" else "1")
                ]
            ]
            [ div
              [ id "ui-load-progress-bar"
              , style
                  [ ("width", toString loadProgress ++ "%")
                  ]
              ]
              []
            ]
        ]
      -- [ text loadPercent ]
{-
        [ div []
          [ text ("Left: " ++ toString model.left)
          , button [] [text "⇦"]
          , button [] [text "←"]
          , button [] [text "→"]
          , button [] [text "⇨"]
          ]
        , div []
          [ text ("Top: " ++ toString model.top)
          , button [] [text "⇧"]
          , button [] [text "↑"]
          , button [] [text "↓"]
          , button [] [text "⇩"]
          ]
        , div []
          [ text ("Scale: 1/2^" ++ toString model.zoom)
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
-}


---- INPUTS ----


port storedModel : Maybe Model
port maxVertexCount : Int


init : (Model, Effects Action)
init =
    ( Maybe.withDefault defaultModel storedModel
    , Effects.task (Task.succeed Idle)
    )


port vertexCount : Signal Int


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map SetVertexCount vertexCount
          ]
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


port model : Signal Model
port model =
    app.model


port left : Signal Float
port left =
    Signal.map .left app.model


port top : Signal Float
port top =
    Signal.map .top app.model


port zoom : Signal Float
port zoom =
    Signal.map .zoom app.model


main : Signal Html
main =
    app.html
