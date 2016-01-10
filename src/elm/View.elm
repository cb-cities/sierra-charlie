module View where

import Html exposing (Html, a, div, span, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)

import Types exposing (..)


viewTOID : Trigger -> String -> Html
viewTOID trigger toid =
    a
      [ onClick trigger (SendClickedTOID (Just toid))
      , onMouseEnter trigger (SendHoveredTOID (Just toid))
      , onMouseLeave trigger (SendHoveredTOID Nothing)
      ]
      [text toid]


viewTOIDItem : Trigger -> String -> Html
viewTOIDItem trigger toid =
    div []
      [ span [] [text "* "]
      , span [] [viewTOID trigger toid]
      ]


viewTOIDItems : Trigger -> String -> List String -> List Html
viewTOIDItems trigger label toids =
    if toids == []
      then []
      else
        [ div []
            ( [div [class "ui-feature-label"] [text label]] ++
              List.map (viewTOIDItem trigger) toids
            )
        ]


viewRoadNode : Trigger -> RoadNode -> Html
viewRoadNode trigger node =
    let
      tagPart =
        [div [class "ui-feature-tag"] [text "Road Node"]]
      toidPart =
        [ div []
            [ div [class "ui-feature-label"] [text "TOID: "]
            , div [] [viewTOID trigger node.toid]
            ]
        ]
      roadLinksPart =
        viewTOIDItems trigger "Road Links: " node.roadLinks
      addressPart =
        case node.address of
          Nothing ->
            []
          Just address ->
            [ div []
                [ div [class "ui-feature-label"] [text "Approximate Address: "]
                , div [] [text address]
                ]
            ]
    in
      div [] (tagPart ++ toidPart ++ roadLinksPart ++ addressPart)


viewRoadLink : Trigger -> RoadLink -> Html
viewRoadLink trigger link =
    let
      tagPart =
        [div [class "ui-feature-tag"] [text "Road Link"]]
      toidPart =
        [ div []
            [ div [class "ui-feature-label"] [text "TOID: "]
            , div [] [viewTOID trigger link.toid]
            ]
        ]
      roadNodesPart =
        case (link.negativeNode, link.positiveNode) of
          (Nothing, Nothing) ->
            []
          (Just neg, Nothing) ->
            [ div []
                [ div [class "ui-feature-label"] [text "Road Nodes: "]
                , div [] [ span [] [text "- "]
                         , viewTOID trigger neg
                         ]
                ]
            ]
          (Nothing, Just pos) ->
            [ div []
                [ div [class "ui-feature-label"] [text "Road Nodes: "]
                , div [] [ span [] [text "+ "]
                         , viewTOID trigger pos
                         ]
                ]
            ]
          (Just neg, Just pos) ->
            [ div []
                [ div [class "ui-feature-label"] [text "Road Nodes: "]
                , div [] [ span [] [text "- "]
                         , viewTOID trigger neg
                         ]
                , div [] [ span [] [text "+ "]
                         , viewTOID trigger pos
                         ]
                ]
            ]
      descriptionPart =
        [ div []
            [ div [class "ui-feature-label"] [text "Description: "]
            , div [] [text (link.term ++ ", " ++ link.nature)]
            ]
        ]
      roadsPart =
        if link.roads == []
          then []
          else
            [ div []
                ( [div [class "ui-feature-label"] [text "Roads: "]] ++
                    List.map (viewRoadItem trigger) link.roads
                )
            ]
    in
      div [] (tagPart ++ toidPart ++ roadNodesPart ++ descriptionPart ++ roadsPart)


viewRoadItem : Trigger -> Road -> Html
viewRoadItem trigger road =
    let
      toidPart =
        [viewTOIDItem trigger road.toid]
      description =
        case road.term of
          Nothing ->
            road.name ++ ", " ++ road.group
          Just term ->
            road.name ++ ", " ++ road.group ++ ", " ++ term
      descriptionPart =
        [ div []
            [ span [] [text "  "]
            , span [] [text description]
            ]
        ]
    in
      div [] (toidPart ++ descriptionPart)


viewRoad : Trigger -> Road -> Html
viewRoad trigger road =
    let
      tagPart =
        [div [class "ui-feature-tag"] [text "Road"]]
      toidPart =
        [ div []
            [ div [class "ui-feature-label"] [text "TOID: "]
            , div [] [viewTOID trigger road.toid]
            ]
        ]
      namePart =
        [ div []
            [ div [class "ui-feature-label"] [text "Name: "]
            , div [] [text road.name]
            ]
        ]
      description =
        case road.term of
          Nothing ->
            road.name ++ ", " ++ road.group
          Just term ->
            road.name ++ ", " ++ road.group ++ ", " ++ term
      descriptionPart =
        [ div []
            [ div [class "ui-feature-label"] [text "Description: "]
            , div [] [text description]
            ]
        ]
      roadLinksPart =
        viewTOIDItems trigger "Road Links: " road.roadLinks
    in
      div [] (tagPart ++ toidPart ++ namePart ++ descriptionPart ++ roadLinksPart)


viewFeature : Trigger -> String -> Maybe Feature -> Html
viewFeature trigger featureId feature =
    case feature of
      Nothing ->
        div [id featureId, class "ui-feature", style [("display", "none")]] []
      Just f ->
        let
          contents =
            case (f.tag, f.roadNode, f.roadLink, f.road) of
              ("roadNode", Just node, Nothing, Nothing) ->
                [viewRoadNode trigger node]
              ("roadLink", Nothing, Just link, Nothing) ->
                [viewRoadLink trigger link]
              ("road", Nothing, Nothing, Just road) ->
                [viewRoad trigger road]
              _ ->
                []
        in
          div [id featureId, class "ui-feature"] contents


view : Trigger -> Model -> Html
view trigger model =
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
      , viewFeature trigger "ui-highlighted-feature" model.highlightedFeature
      , viewFeature trigger "ui-selected-feature" model.selectedFeature
      ]
