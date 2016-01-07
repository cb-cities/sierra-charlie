module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, id, style)
import Maybe exposing (withDefault)
import StartApp exposing (App)
import Task exposing (Task)


type alias RoadNode =
  { toid : String
  , address : Maybe String
  , roadLinks : List String
  }


type alias RoadLink =
  { toid : String
  , term : String
  , nature : String
  , negativeNode : Maybe String
  , positiveNode : Maybe String
  , roads : List String
  }


type alias Feature =
  { tag : String
  , roadNode : Maybe RoadNode
  , roadLink : Maybe RoadLink
  }


type alias Model =
  { loadingProgress : Float
  , hoveredFeature : Maybe Feature
  , selectedFeature : Maybe Feature
  }


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  , hoveredFeature = Nothing
  , selectedFeature = Nothing
  }


type Action =
    Idle
  | SetLoadingProgress Float
  | SetHoveredFeature (Maybe Feature)
  | SetSelectedFeature (Maybe Feature)


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
      SetHoveredFeature newFeature ->
        {model | hoveredFeature = newFeature}
          |> noEffect
      SetSelectedFeature newFeature ->
        {model | selectedFeature = newFeature}
          |> noEffect


viewRoadNode : RoadNode -> Html
viewRoadNode rn =
    let
      tag =
        [div [class "ui-feature-tag"] [text "Road Node"]]
      toid =
        [ div []
            [ div [class "ui-feature-key"] [text "TOID: "]
            , div [] [text rn.toid]
            ]
        ]
      address =
        [ div []
            [ div [class "ui-feature-key"] [text "Address: "]
            , div [] [text (withDefault "—" rn.address)]
            ]
        ]
      roadLinks =
        [ div []
            ( [div [class "ui-feature-key"] [text "Road Links: "]] ++
              case rn.roadLinks of
                [] ->
                  [div [] [text "—"]]
                _ ->
                  List.concatMap (\str -> [div [] [text str]]) rn.roadLinks
            )
        ]
    in
      div [] (tag ++ toid ++ address ++ roadLinks)


viewRoadLink : RoadLink -> Html
viewRoadLink rl =
    let
      tag =
        [div [class "ui-feature-tag"] [text "Road Link"]]
      toid =
        [ div []
            [ div [class "ui-feature-key"] [text "TOID: "]
            , div [] [text rl.toid]
            ]
        ]
      term =
        [ div []
            [ div [class "ui-feature-key"] [text "Term: "]
            , div [] [text rl.term]
            ]
        ]
      nature =
        [ div []
            [ div [class "ui-feature-key"] [text "Nature: "]
            , div [] [text rl.nature]
            ]
        ]
      negativeNode =
        [ div []
            [ div [class "ui-feature-key"] [text "Negative Node: "]
            , div [] [text (withDefault "—" rl.negativeNode)]
            ]
        ]
      positiveNode =
        [ div []
            [ div [class "ui-feature-key"] [text "Positive Node: "]
            , div [] [text (withDefault "—" rl.positiveNode)]
            ]
        ]
      roads =
        [ div []
            ( [div [class "ui-feature-key"] [text "Roads: "]] ++
              case rl.roads of
                [] ->
                  [div [] [text "—"]]
                _ ->
                  List.concatMap (\str -> [div [] [text str]]) rl.roads
            )
        ]
    in
      div [] (tag ++ toid ++ term ++ nature ++ positiveNode ++ negativeNode ++ roads)


viewFeature : String -> Maybe Feature -> Html
viewFeature featureId feature =
    case feature of
      Nothing ->
        div [id featureId, style [("opacity", "0")]] []
      Just f ->
        let
          contents =
            case (f.tag, f.roadNode, f.roadLink) of
              ("roadNode", Just rn, Nothing) ->
                [viewRoadNode rn]
              ("roadLink", Nothing, Just rl) ->
                [viewRoadLink rl]
              _ ->
                []
        in
          div [id featureId, style [("opacity", "1")]] contents


view : Signal.Address Action -> Model -> Html
view address model =
    div []
      [ div
          [ id "ui-loading-progress-track"
          , style [("opacity", if model.loadingProgress == 100 then "0" else "1")]
          ]
          [ div
            [ id "ui-loading-progress-bar"
            , style [("width", toString model.loadingProgress ++ "%")]
            ]
            []
          ]
      , viewFeature "ui-hovered-feature" model.hoveredFeature
      , viewFeature "ui-selected-feature" model.selectedFeature
      ]


init : (Model, Effects Action)
init =
    (defaultModel, Task.succeed Idle |> Effects.task)


port setLoadingProgress : Signal Float
port setHoveredFeature : Signal (Maybe Feature)
port setSelectedFeature : Signal (Maybe Feature)


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map SetLoadingProgress setLoadingProgress
          , Signal.map SetHoveredFeature setHoveredFeature
          , Signal.map SetSelectedFeature setSelectedFeature
          ]
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


main : Signal Html
main =
    app.html
