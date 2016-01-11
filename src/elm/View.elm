module View where

import Html exposing (Html, a, div, span, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)

import Types exposing (..)


viewFeatureTag : String -> Html
viewFeatureTag tag =
    div [class "ui-feature-tag"] [text tag]


viewFeatureLabel : String -> Html
viewFeatureLabel label =
    div [class "ui-feature-label"] [text (label ++ ": ")]


viewItem : String -> Html -> Html
viewItem bullet item =
    div []
      [ span [] [text (bullet ++ " ")]
      , span [] [item]
      ]


viewTOID : Trigger -> String -> Html
viewTOID trigger toid =
    a
      [ onClick trigger (SelectFeature (Just toid))
      , onMouseEnter trigger (HighlightFeature (Just toid))
      , onMouseLeave trigger (HighlightFeature Nothing)
      ]
      [text toid]


viewTOIDItem : Trigger -> String -> String -> Html
viewTOIDItem trigger bullet toid =
    viewItem bullet (viewTOID trigger toid)


viewLabeled : String -> List Html -> List Html
viewLabeled label contents =
    [div [] ([viewFeatureLabel label] ++ contents)]


viewLabeledList : String -> (a -> Html) -> List a -> List Html
viewLabeledList label view items =
    case items of
      [] ->
        []
      _ ->
        viewLabeled label (List.map view items)


viewRoadNode : Trigger -> Maybe String -> RoadNode -> Html
viewRoadNode trigger maybeMode roadNode =
    let
      tag =
        [viewFeatureTag "Road Node"]
      description =
        case roadNode.address of
          Nothing ->
            []
          Just address ->
            viewLabeled "Description" [text address]
      actions =
        [ div [class "ui-actions"]
            [ viewFeatureLabel "Actions"
            , case maybeMode of
                Just "routing" ->
                  a [onClick trigger (SetMode Nothing)] [text "Stop Routing"]
                _ ->
                  a [onClick trigger (SetMode (Just "routing"))] [text "Start Routing"]
            ]
        ]
      toid =
        viewLabeled "TOID" [viewTOID trigger roadNode.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") roadNode.roadLinks
    in
      div [] (tag ++ description ++ actions ++ toid ++ roadLinks)


viewRoadLinkDescription : RoadLink -> Html
viewRoadLinkDescription roadLink =
    text (roadLink.term ++ ", " ++ roadLink.nature)


viewRoadLink : Trigger -> RoadLink -> Html
viewRoadLink trigger roadLink =
    let
      tag =
        [viewFeatureTag "Road Link"]
      description =
        viewLabeled "Description" [viewRoadLinkDescription roadLink]
      toid =
        viewLabeled "TOID" [viewTOID trigger roadLink.toid]
      roadNodes =
        case (roadLink.negativeNode, roadLink.positiveNode) of
          (Nothing, Nothing) ->
            []
          (Just negativeNode, Nothing) ->
            viewLabeled "Road Nodes"
              [ viewTOIDItem trigger "-" negativeNode
              ]
          (Nothing, Just positiveNode) ->
            viewLabeled "Road Nodes"
              [ viewTOIDItem trigger "+" positiveNode
              ]
          (Just negativeNode, Just positiveNode) ->
            viewLabeled "Road Nodes"
              [ viewTOIDItem trigger "-" negativeNode
              , viewTOIDItem trigger "+" positiveNode
              ]
      roads =
        viewLabeledList "Roads" (viewRoadItem trigger) roadLink.roads
    in
      div [] (tag ++ description ++ toid ++ roadNodes ++ roads)


viewRoadDescription : Road -> Html
viewRoadDescription road =
    case road.term of
      Nothing ->
        text (road.name ++ ", " ++ road.group)
      Just term ->
        text (road.name ++ ", " ++ road.group ++ ", " ++ term)


viewRoadItem : Trigger -> Road -> Html
viewRoadItem trigger road =
    let
      toid =
        [viewTOIDItem trigger "*" road.toid]
      description =
        [viewItem " " (viewRoadDescription road)]
    in
      div [] (toid ++ description)


viewRoad : Trigger -> Road -> Html
viewRoad trigger road =
    let
      tag =
        [viewFeatureTag "Road"]
      description =
        viewLabeled "Description" [viewRoadDescription road]
      toid =
        viewLabeled "TOID" [viewTOID trigger road.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") road.roadLinks
    in
      div [] (tag ++ description ++ toid ++ roadLinks)


viewFeature : Trigger -> Maybe String -> String -> Maybe Feature -> Html
viewFeature trigger maybeMode featureId maybeFeature =
    let
      display =
        if maybeFeature == Nothing
          then [style [("display", "none")]]
          else []
      contents =
        case maybeFeature of
          Nothing ->
            []
          Just feature ->
            case (feature.tag, feature.roadNode, feature.roadLink, feature.road) of
              ("roadNode", Just roadNode, Nothing, Nothing) ->
                [viewRoadNode trigger maybeMode roadNode]
              ("roadLink", Nothing, Just roadLink, Nothing) ->
                [viewRoadLink trigger roadLink]
              ("road", Nothing, Nothing, Just road) ->
                [viewRoad trigger road]
              _ ->
                []
    in
      div ([id featureId, class "ui-feature"] ++ display) contents


viewLoadingProgress : Float -> Html
viewLoadingProgress loadingProgress =
    let
      opacity =
        if loadingProgress == 100
          then [style [("opacity", "0")]]
          else []
    in
      div ([id "ui-loading-progress-track"] ++ opacity)
        [ div
            [ id "ui-loading-progress-bar"
            , style [("width", toString loadingProgress ++ "%")]
            ]
            []
        ]


view : Trigger -> State -> Html
view trigger state =
    div []
      [ viewLoadingProgress state.loadingProgress
      , viewFeature trigger state.mode "ui-highlighted-feature" state.highlightedFeature
      , viewFeature trigger state.mode "ui-selected-feature" state.selectedFeature
      ]
