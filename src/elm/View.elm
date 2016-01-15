module View where

import Html exposing (Html, a, div, span, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)

import Types exposing (..)


viewWindowTitle : String -> Html
viewWindowTitle title =
    div [class "ui-window-title"] [text title]


viewLabel : String -> Html
viewLabel label =
    div [class "ui-label"] [text label]


viewItem : Html -> Html
viewItem item =
    div [] [item]


viewTOID : Trigger -> String -> Html
viewTOID trigger toid =
    a
      [ onClick trigger (SelectFeature (Just toid))
      , onMouseEnter trigger (HighlightFeature (Just toid))
      , onMouseLeave trigger (HighlightFeature Nothing)
      ]
      [text toid]


viewTOIDItem : Trigger -> String -> Html
viewTOIDItem trigger toid =
    viewItem (viewTOID trigger toid)


viewLabeled : String -> List Html -> List Html
viewLabeled label contents =
    [div [] ([viewLabel label] ++ contents)]


viewLabeledList : String -> (a -> Html) -> List a -> List Html
viewLabeledList label view items =
    case items of
      [] ->
        []
      _ ->
        viewLabeled label (List.map view items)


viewActions : List Html -> List Html
viewActions contents =
    [div [class "ui-actions"] contents]


viewRoadNode : Trigger -> Maybe String -> String -> RoadNode -> List Html
viewRoadNode trigger maybeMode titlePrefix roadNode =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road Node")]
      description =
        case roadNode.address of
          Nothing ->
            []
          Just address ->
            [div [] [text address]]
      actions =
        case (roadNode.isDeleted, roadNode.isUndeletable) of
          (False, _) ->
            viewActions
              [ case maybeMode of
                  Just "routing" ->
                    viewItem (a [onClick trigger (SetMode Nothing), class "ui-active"] [text "Get Route…"])
                  _ ->
                    viewItem (a [onClick trigger (SetMode (Just "routing"))] [text "Get Route…"])
              , viewItem (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
              ]
          (True, True) ->
            viewActions
              [ viewItem (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])
              ]
          _ ->
            []
      toid =
        viewLabeled "TOID" [viewTOID trigger roadNode.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger) roadNode.roadLinkTOIDs
    in
      title ++ description ++ actions ++ toid ++ roadLinks


viewRoadLinkDescription : RoadLink -> Html
viewRoadLinkDescription roadLink =
    text (roadLink.term ++ ", " ++ roadLink.nature)


viewRoadLink : Trigger -> String -> RoadLink -> List Html
viewRoadLink trigger titlePrefix roadLink =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road Link")]
      description =
        [div [] [viewRoadLinkDescription roadLink]]
      actions =
        case (roadLink.isDeleted, roadLink.isUndeletable) of
          (False, _) ->
            viewActions
              [ viewItem (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
              ]
          (True, True) ->
            viewActions
              [ viewItem (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])
              ]
          _ ->
            []
      toid =
        viewLabeled "TOID" [viewTOID trigger roadLink.toid]
      roadNodes =
        case (roadLink.negativeNodeTOID, roadLink.positiveNodeTOID) of
          (Nothing, Nothing) ->
            []
          (Just negativeNodeTOID, Nothing) ->
            viewLabeled "Road Nodes"
              [ viewItem (span [] [text "− ", viewTOID trigger negativeNodeTOID])
              ]
          (Nothing, Just positiveNodeTOID) ->
            viewLabeled "Road Nodes"
              [ viewItem (span [] [text "+ ", viewTOID trigger positiveNodeTOID])
              ]
          (Just negativeNodeTOID, Just positiveNodeTOID) ->
            viewLabeled "Road Nodes"
              [ viewItem (span [] [text "− ", viewTOID trigger negativeNodeTOID])
              , viewItem (span [] [text "+ ", viewTOID trigger positiveNodeTOID])
              ]
      roads =
        viewLabeledList "Roads" (viewRoadItem trigger) roadLink.roads
    in
      title ++ description ++ actions ++ toid ++ roadNodes ++ roads


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
        [viewTOIDItem trigger road.toid]
      description =
        [viewItem (viewRoadDescription road)]
    in
      div [] (toid ++ description)


viewRoad : Trigger -> String -> Road -> List Html
viewRoad trigger titlePrefix road =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road")]
      description =
        [div [] [viewRoadDescription road]]
      actions =
        case road.isDeleted of
          False ->
            viewActions
              [ viewItem (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
              ]
          True ->
            viewActions
              [ viewItem (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])
              ]
      toid =
        viewLabeled "TOID" [viewTOID trigger road.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger) road.roadLinkTOIDs
    in
      title ++ description ++ actions ++ toid ++ roadLinks


viewRoute : Trigger -> String -> Route -> List Html
viewRoute trigger titlePrefix route =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Route")]
      actions =
        viewActions
          [ viewItem (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
          ]
      toid =
        viewLabeled "TOID" [viewTOID trigger route.toid]
      roadNodes =
        viewLabeled "Road Nodes"
          [ viewItem (span [] [text "< ", viewTOID trigger route.startNodeTOID])
          , viewItem (span [] [text "> ", viewTOID trigger route.endNodeTOID])
          ]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger) route.roadLinkTOIDs
    in
      title ++ actions ++ toid ++ roadNodes ++ roadLinks


viewFeature : Trigger -> Maybe String -> String -> Maybe Feature -> Html
viewFeature trigger maybeMode featureKind maybeFeature =
    let
      featureId =
        if featureKind == "highlighted"
          then "ui-highlighted-feature"
          else "ui-selected-feature"
      titlePrefix =
        if featureKind == "highlighted"
          then "Highlighted"
          else "Selected"
      display =
        if maybeFeature == Nothing
          then [style [("display", "none")]]
          else []
      contents =
        case maybeFeature of
          Nothing ->
            []
          Just feature ->
            case (feature.tag, feature.roadNode, feature.roadLink, feature.road, feature.route) of
              ("roadNode", Just roadNode, Nothing, Nothing, Nothing) ->
                viewRoadNode trigger maybeMode titlePrefix roadNode
              ("roadLink", Nothing, Just roadLink, Nothing, Nothing) ->
                viewRoadLink trigger titlePrefix roadLink
              ("road", Nothing, Nothing, Just road, Nothing) ->
                viewRoad trigger titlePrefix road
              ("route", Nothing, Nothing, Nothing, Just route) ->
                viewRoute trigger titlePrefix route
              _ ->
                []
    in
      div ([id featureId, class "ui-window"] ++ display) contents


viewRoutes : Trigger -> String -> List Route -> List Html
viewRoutes trigger label routes =
    viewLabeledList label (viewTOIDItem trigger) (List.map .toid routes)


viewRoutesWindow : Trigger -> List Route -> Html
viewRoutesWindow trigger routes =
    let
      display =
        if routes == []
          then [style [("display", "none")]]
          else []
      contents =
        if routes == []
          then []
          else
            let
              validRoutes =
                case List.filter .isValid routes of
                  [] ->
                    []
                  validList ->
                    viewRoutes trigger "Valid Routes" validList
              invalidRoutes =
                case List.filter (not << .isValid) routes of
                  [] ->
                    []
                  invalidList ->
                    viewRoutes trigger "Invalid Routes" invalidList
            in
              [viewWindowTitle "Routes"] ++
              viewActions
                [ viewItem (a [onClick trigger ClearRoutes] [text "Clear"])
                ] ++
              validRoutes ++
              invalidRoutes
    in
      div ([class "ui-window"] ++ display) contents


viewAdjustmentWindow : Trigger -> Maybe Adjustment -> Html
viewAdjustmentWindow trigger maybeAdjustment =
    let
      isEmpty =
        case maybeAdjustment of
          Nothing ->
            True
          Just adjustment ->
            if adjustment.deletedItemCount == 0
              then True
              else False
      display =
        if isEmpty
          then [style [("display", "none")]]
          else []
      contents =
        case maybeAdjustment of
          Nothing ->
            []
          Just adjustment ->
            [viewWindowTitle "Adjustment"] ++
            viewActions
              [ viewItem (a [onClick trigger ClearAdjustment] [text "Clear"])
              ] ++
            [ div []
                ( viewLabeledList "Deleted Nodes" (viewTOIDItem trigger) adjustment.deletedRoadNodeTOIDs ++
                  viewLabeledList "Deleted Links" (viewTOIDItem trigger) adjustment.deletedRoadLinkTOIDs ++
                  viewLabeledList "Deleted Roads" (viewTOIDItem trigger) adjustment.deletedRoadTOIDs
                )
            ]
    in
      div ([class "ui-window"] ++ display) contents


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
      [ div []
          [ viewLoadingProgress state.loadingProgress
          , viewFeature trigger state.mode "highlighted" state.highlightedFeature
          , viewFeature trigger state.mode "selected" state.selectedFeature
          ]
      , div [id "ui-windows-top-left"]
          []
      , div [id "ui-windows-top-right"]
          [ viewAdjustmentWindow trigger state.adjustment
          , viewRoutesWindow trigger state.routes
          ]
      ]
