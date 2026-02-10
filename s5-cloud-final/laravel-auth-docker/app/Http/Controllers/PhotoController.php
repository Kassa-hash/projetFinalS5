<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use App\Models\ProblemeRoutier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    /**
     * Récupérer toutes les photos d'un problème
     */
    public function index($id_probleme)
    {
        $photos = Photo::where('id_probleme', $id_probleme)
            ->orderBy('date_upload', 'desc')
            ->get()
            ->map(fn($photo) => [
                'id' => $photo->id,
                'nom_fichier' => $photo->nom_fichier,
                'url' => url('storage/' . $photo->chemin_fichier),
                'taille' => $photo->taille,
                'date_upload' => $photo->date_upload,
                'description' => $photo->description,
            ]);

        return response()->json($photos);
    }

    /**
     * Uploader une photo
     */
    public function store(Request $request, $id_probleme)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'description' => 'nullable|string|max:500',
        ]);

        // Vérifier que le problème existe
        $probleme = ProblemeRoutier::findOrFail($id_probleme);

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            
            // Créer un dossier par problème: photos/probleme_{id}/
            $path = "photos/probleme_{$id_probleme}";
            $filename = time() . '_' . $file->getClientOriginalName();
            
            // Sauvegarder le fichier dans storage/app/public/
            $filePath = $file->storeAs($path, $filename, 'public');

            // Enregistrer dans la base de données
            $photo = Photo::create([
                'id_probleme' => $id_probleme,
                'nom_fichier' => $filename,
                'chemin_fichier' => $filePath,
                'mime_type' => $file->getMimeType(),
                'taille' => $file->getSize(),
                'description' => $request->input('description'),
            ]);

            return response()->json([
                'message' => 'Photo uploadée avec succès',
                'photo' => [
                    'id' => $photo->id,
                    'nom_fichier' => $photo->nom_fichier,
                    'url' => url('storage/' . $photo->chemin_fichier),
                    'description' => $photo->description,
                ],
            ], 201);
        }

        return response()->json(['error' => 'Aucun fichier uploadé'], 400);
    }

    /**
     * Supprimer une photo
     */
    public function destroy($id)
    {
        $photo = Photo::findOrFail($id);
        
        // Supprimer le fichier du stockage
        Storage::disk('public')->delete($photo->chemin_fichier);
        
        // Supprimer l'entrée de la base de données
        $photo->delete();

        return response()->json(['message' => 'Photo supprimée avec succès']);
    }

    /**
     * Mettre à jour la description d'une photo
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'description' => 'required|string|max:500',
        ]);

        $photo = Photo::findOrFail($id);
        $photo->update(['description' => $request->input('description')]);

        return response()->json(['message' => 'Photo mise à jour']);
    }
}
