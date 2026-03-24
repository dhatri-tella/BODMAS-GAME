<?php
/**
 * Simple Leaderboard API
 * Stores scores in a JSON file for persistence.
 */

$file = 'scores.json';

// Get current scores
function getScores($file) {
    if (!file_exists($file)) return [];
    $data = file_get_contents($file);
    return json_decode($data, true) ?: [];
}

// Handle GET: Return leaderboard
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $scores = getScores($file);
    // Sort by score descending
    usort($scores, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    // Return top 10
    echo json_encode(array_slice($scores, 0, 10));
    exit;
}

// Handle POST: Add new score
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $newData = json_decode($json, true);

    if (isset($newData['name']) && isset($newData['score'])) {
        $scores = getScores($file);
        $scores[] = [
            'name' => htmlspecialchars($newData['name']),
            'score' => (int)$newData['score'],
            'date' => date('Y-m-d H:i:s')
        ];
        file_put_contents($file, json_encode($scores));
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
    }
    exit;
}
?>
